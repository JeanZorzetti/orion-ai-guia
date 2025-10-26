"""
Endpoints de API para Integrações com Canais de Venda (Shopify, Mercado Livre, etc.)
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.services.integration_service import ShopifyIntegrationService
from app.core.encryption import FieldEncryption
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class ShopifyConfigRequest(BaseModel):
    """Schema para configuração de integração Shopify"""
    store_url: str = Field(..., description="URL da loja Shopify (ex: minhaloja.myshopify.com)")
    api_key: str = Field(..., min_length=20, description="API Access Token da Shopify")


class ShopifyConfigResponse(BaseModel):
    """Schema de resposta da configuração Shopify"""
    store_url: Optional[str] = None
    last_sync: Optional[datetime] = None
    has_api_key: bool


class ShopifySyncRequest(BaseModel):
    """Schema para sincronização de pedidos Shopify"""
    limit: int = Field(default=250, ge=1, le=250, description="Número máximo de pedidos para sincronizar")


class ShopifySyncResponse(BaseModel):
    """Schema de resposta da sincronização"""
    success: bool
    new_orders_imported: int
    skipped_orders: int
    errors: list
    message: str


# ============================================================================
# ENDPOINTS - SHOPIFY
# ============================================================================

@router.post("/shopify/config", status_code=status.HTTP_200_OK)
async def configure_shopify(
    config: ShopifyConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Configura ou atualiza as credenciais de integração com Shopify

    Requer:
    - store_url: URL da loja Shopify (ex: minhaloja.myshopify.com)
    - api_key: API Access Token (Admin API access token)

    Como obter as credenciais Shopify:
    1. Acesse o admin da sua loja Shopify
    2. Vá em Apps > Develop apps > Create an app
    3. Configure o app e instale-o
    4. Copie o "Admin API access token"
    """
    workspace = current_user.workspace

    try:
        # Limpar URL da loja
        store_url = config.store_url.replace('https://', '').replace('http://', '').strip('/')

        # Criptografar API key
        encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)
        encrypted_api_key = encryption.encrypt(config.api_key)

        # Atualizar workspace
        workspace.integration_shopify_store_url = store_url
        workspace.integration_shopify_api_key = encrypted_api_key

        db.commit()

        logger.info(f"Shopify configurado para workspace {workspace.id}: {store_url}")

        return {
            "success": True,
            "message": "Credenciais Shopify salvas com sucesso",
            "store_url": store_url
        }

    except Exception as e:
        logger.error(f"Erro ao configurar Shopify: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar configurações: {str(e)}"
        )


@router.get("/shopify/config", response_model=ShopifyConfigResponse)
async def get_shopify_config(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna a configuração atual de integração com Shopify
    (sem expor a API key por segurança)
    """
    workspace = current_user.workspace

    return ShopifyConfigResponse(
        store_url=workspace.integration_shopify_store_url,
        last_sync=workspace.integration_shopify_last_sync,
        has_api_key=bool(workspace.integration_shopify_api_key)
    )


@router.post("/shopify/test-connection")
async def test_shopify_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Testa a conexão com a Shopify usando as credenciais configuradas
    """
    workspace = current_user.workspace

    if not workspace.integration_shopify_store_url or not workspace.integration_shopify_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciais Shopify não configuradas. Configure primeiro em Integrações."
        )

    try:
        integration = ShopifyIntegrationService(workspace, db)
        result = await integration.test_connection()

        if result['success']:
            return {
                "success": True,
                "message": f"Conexão bem-sucedida com {result['shop_name']}!",
                "shop_name": result['shop_name'],
                "shop_domain": result['shop_domain']
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result['error']
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro ao testar conexão Shopify: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao testar conexão: {str(e)}"
        )


@router.post("/shopify/sync-orders", response_model=ShopifySyncResponse)
async def sync_shopify_orders(
    sync_request: ShopifySyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza pedidos da Shopify para o Orion ERP

    - Importa apenas pedidos PAGOS (financial_status=paid)
    - Busca pedidos desde a última sincronização
    - Pula pedidos já importados
    - Mapeia produtos pelo SKU
    - Máximo de 250 pedidos por sincronização

    Retorna:
    - new_orders_imported: Número de novos pedidos importados
    - skipped_orders: Pedidos que já existiam
    - errors: Lista de erros encontrados
    """
    workspace = current_user.workspace

    if not workspace.integration_shopify_store_url or not workspace.integration_shopify_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Credenciais Shopify não configuradas. Configure primeiro em Integrações."
        )

    try:
        integration = ShopifyIntegrationService(workspace, db)
        result = await integration.sync_orders(limit=sync_request.limit)

        if not result['success']:
            # Houve erros, mas retornamos 200 com os detalhes
            logger.warning(f"Sincronização Shopify com erros: {result['errors']}")

        return ShopifySyncResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro na sincronização Shopify: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização: {str(e)}"
        )


@router.delete("/shopify/config")
async def delete_shopify_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a configuração de integração com Shopify
    """
    workspace = current_user.workspace

    try:
        workspace.integration_shopify_store_url = None
        workspace.integration_shopify_api_key = None
        workspace.integration_shopify_last_sync = None

        db.commit()

        logger.info(f"Shopify desconectado do workspace {workspace.id}")

        return {
            "success": True,
            "message": "Integração Shopify removida com sucesso"
        }

    except Exception as e:
        logger.error(f"Erro ao remover Shopify: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover integração: {str(e)}"
        )
