"""
Endpoints de API para Integrações com Canais de Venda (Shopify, Mercado Livre, etc.)
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.workspace import Workspace
from app.services.integration_service import ShopifyIntegrationService, MercadoLivreIntegrationService, WooCommerceIntegrationService
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


# ============================================================================
# SCHEMAS - MERCADO LIVRE
# ============================================================================

class MercadoLivreCallbackRequest(BaseModel):
    """Schema para callback OAuth do Mercado Livre"""
    code: str = Field(..., description="Código de autorização retornado pelo ML")


class MercadoLivreConfigResponse(BaseModel):
    """Schema de resposta da configuração Mercado Livre"""
    user_id: Optional[str] = None
    nickname: Optional[str] = None
    last_sync: Optional[datetime] = None
    has_token: bool
    token_expires_at: Optional[datetime] = None


class MercadoLivreSyncRequest(BaseModel):
    """Schema para sincronização de pedidos Mercado Livre"""
    limit: int = Field(default=50, ge=1, le=50, description="Número máximo de pedidos para sincronizar")


class MercadoLivreSyncResponse(BaseModel):
    """Schema de resposta da sincronização ML"""
    success: bool
    new_orders_imported: int
    skipped_orders: int
    errors: list
    message: str


# ============================================================================
# ENDPOINTS - MERCADO LIVRE
# ============================================================================

@router.get("/mercadolivre/auth-url")
async def get_mercadolivre_auth_url():
    """
    Retorna a URL de autorização OAuth do Mercado Livre

    O usuário deve ser redirecionado para esta URL para autorizar o app.
    Após autorizar, o ML redireciona para o redirect_uri com o code.
    """
    # Obter do .env ou settings
    client_id = settings.MERCADOLIVRE_CLIENT_ID
    redirect_uri = settings.MERCADOLIVRE_REDIRECT_URI

    if not client_id or not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Credenciais ML não configuradas no servidor. Configure MERCADOLIVRE_CLIENT_ID e MERCADOLIVRE_REDIRECT_URI"
        )

    auth_url = (
        f"https://auth.mercadolivre.com.br/authorization"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
    )

    return {"auth_url": auth_url}


@router.post("/mercadolivre/callback")
async def mercadolivre_callback(
    callback: MercadoLivreCallbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Processa o callback OAuth do Mercado Livre

    Troca o code por access_token e refresh_token
    """
    import httpx

    workspace = current_user.workspace

    try:
        client_id = settings.MERCADOLIVRE_CLIENT_ID
        client_secret = settings.MERCADOLIVRE_CLIENT_SECRET
        redirect_uri = settings.MERCADOLIVRE_REDIRECT_URI

        # Trocar code por tokens
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mercadolibre.com/oauth/token",
                json={
                    "grant_type": "authorization_code",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": callback.code,
                    "redirect_uri": redirect_uri
                }
            )

        if response.status_code != 200:
            error_data = response.json()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Erro ao obter token ML: {error_data.get('message', 'Erro desconhecido')}"
            )

        token_data = response.json()

        # Buscar dados do usuário
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://api.mercadolibre.com/users/me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"}
            )

        user_data = user_response.json()

        # Criptografar tokens
        encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)
        encrypted_access = encryption.encrypt(token_data['access_token'])
        encrypted_refresh = encryption.encrypt(token_data['refresh_token'])

        # Salvar no workspace
        workspace.integration_mercadolivre_access_token = encrypted_access
        workspace.integration_mercadolivre_refresh_token = encrypted_refresh
        workspace.integration_mercadolivre_user_id = str(user_data['id'])
        workspace.integration_mercadolivre_token_expires_at = datetime.utcnow().replace(
            microsecond=0
        ) + timedelta(seconds=token_data.get('expires_in', 21600))  # 6 horas padrão

        db.commit()

        logger.info(f"Mercado Livre conectado para workspace {workspace.id}: user_id={user_data['id']}")

        return {
            "success": True,
            "message": "Mercado Livre conectado com sucesso!",
            "user_id": user_data['id'],
            "nickname": user_data.get('nickname')
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro no callback ML: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar callback: {str(e)}"
        )


@router.get("/mercadolivre/config", response_model=MercadoLivreConfigResponse)
async def get_mercadolivre_config(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna a configuração atual de integração com Mercado Livre
    """
    workspace = current_user.workspace

    return MercadoLivreConfigResponse(
        user_id=workspace.integration_mercadolivre_user_id,
        nickname=None,  # Não temos armazenado, mas poderia buscar da API
        last_sync=workspace.integration_mercadolivre_last_sync,
        has_token=bool(workspace.integration_mercadolivre_access_token),
        token_expires_at=workspace.integration_mercadolivre_token_expires_at
    )


@router.post("/mercadolivre/test-connection")
async def test_mercadolivre_connection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Testa a conexão com o Mercado Livre usando o token atual
    """
    workspace = current_user.workspace

    if not workspace.integration_mercadolivre_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mercado Livre não está conectado. Faça a autenticação OAuth primeiro."
        )

    try:
        integration = MercadoLivreIntegrationService(workspace, db)
        result = await integration.test_connection()

        if result['success']:
            return {
                "success": True,
                "message": f"Conexão bem-sucedida!",
                "user_id": result['user_id'],
                "nickname": result['nickname']
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
        logger.error(f"Erro ao testar conexão ML: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao testar conexão: {str(e)}"
        )


@router.post("/mercadolivre/sync-orders", response_model=MercadoLivreSyncResponse)
async def sync_mercadolivre_orders(
    sync_request: MercadoLivreSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sincroniza pedidos do Mercado Livre para o Orion ERP

    - Busca pedidos desde a última sincronização
    - Mapeia produtos pelo SKU
    - Pula pedidos já importados
    - Máximo de 50 pedidos por sincronização
    """
    workspace = current_user.workspace

    if not workspace.integration_mercadolivre_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mercado Livre não está conectado. Faça a autenticação OAuth primeiro."
        )

    try:
        integration = MercadoLivreIntegrationService(workspace, db)
        result = await integration.sync_orders(limit=sync_request.limit)

        return MercadoLivreSyncResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro na sincronização ML: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na sincronização: {str(e)}"
        )


@router.delete("/mercadolivre/config")
async def delete_mercadolivre_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a configuração de integração com Mercado Livre
    """
    workspace = current_user.workspace

    try:
        workspace.integration_mercadolivre_access_token = None
        workspace.integration_mercadolivre_refresh_token = None
        workspace.integration_mercadolivre_user_id = None
        workspace.integration_mercadolivre_last_sync = None
        workspace.integration_mercadolivre_token_expires_at = None

        db.commit()

        logger.info(f"Mercado Livre desconectado do workspace {workspace.id}")

        return {
            "success": True,
            "message": "Integração Mercado Livre removida com sucesso"
        }

    except Exception as e:
        logger.error(f"Erro ao remover ML: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover integração: {str(e)}"
        )


# ============================================================================
# WOOCOMMERCE INTEGRATION ENDPOINTS
# ============================================================================

class WooCommerceConfigRequest(BaseModel):
    """Schema para configuração de integração WooCommerce"""
    store_url: str = Field(..., description="URL da loja WooCommerce (ex: https://minhaloja.com.br)")
    consumer_key: str = Field(..., description="Consumer Key da API WooCommerce")
    consumer_secret: str = Field(..., description="Consumer Secret da API WooCommerce")


@router.post("/woocommerce/config")
async def save_woocommerce_config(
    config: WooCommerceConfigRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Salva configuração de integração com WooCommerce
    """
    workspace = current_user.workspace

    try:
        encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)

        # Criptografar credenciais
        workspace.integration_woocommerce_store_url = config.store_url.rstrip('/')
        workspace.integration_woocommerce_consumer_key = encryption.encrypt(config.consumer_key)
        workspace.integration_woocommerce_consumer_secret = encryption.encrypt(config.consumer_secret)

        db.commit()

        logger.info(f"WooCommerce configurado para workspace {workspace.id}")

        return {
            "success": True,
            "message": "Integração WooCommerce configurada com sucesso",
            "store_url": workspace.integration_woocommerce_store_url
        }

    except Exception as e:
        logger.error(f"Erro ao configurar WooCommerce: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao configurar integração: {str(e)}"
        )


@router.get("/woocommerce/config")
async def get_woocommerce_config(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna configuração atual de integração com WooCommerce
    """
    workspace = current_user.workspace

    if not workspace.integration_woocommerce_store_url:
        return {
            "connected": False,
            "store_url": None,
            "last_sync": None
        }

    return {
        "connected": True,
        "store_url": workspace.integration_woocommerce_store_url,
        "last_sync": workspace.integration_woocommerce_last_sync.isoformat() if workspace.integration_woocommerce_last_sync else None
    }


@router.post("/woocommerce/test-connection")
async def test_woocommerce_connection(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Testa conexão com WooCommerce
    """
    workspace = current_user.workspace

    if not workspace.integration_woocommerce_store_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WooCommerce não está configurado"
        )

    try:
        service = WooCommerceIntegrationService(workspace, db)
        result = await service.test_connection()

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro ao testar conexão WooCommerce: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao testar conexão: {str(e)}"
        )


@router.post("/woocommerce/sync-orders")
async def sync_woocommerce_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Sincroniza pedidos do WooCommerce
    """
    workspace = current_user.workspace

    if not workspace.integration_woocommerce_store_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WooCommerce não está configurado"
        )

    try:
        service = WooCommerceIntegrationService(workspace, db)
        result = await service.sync_orders(limit=limit)

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Erro ao sincronizar pedidos WooCommerce: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao sincronizar pedidos: {str(e)}"
        )


@router.delete("/woocommerce/config")
async def delete_woocommerce_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a configuração de integração com WooCommerce
    """
    workspace = current_user.workspace

    try:
        workspace.integration_woocommerce_store_url = None
        workspace.integration_woocommerce_consumer_key = None
        workspace.integration_woocommerce_consumer_secret = None
        workspace.integration_woocommerce_last_sync = None

        db.commit()

        logger.info(f"WooCommerce desconectado do workspace {workspace.id}")

        return {
            "success": True,
            "message": "Integração WooCommerce removida com sucesso"
        }

    except Exception as e:
        logger.error(f"Erro ao remover WooCommerce: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao remover integração: {str(e)}"
        )
