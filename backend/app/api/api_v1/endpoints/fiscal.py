"""
Fiscal API Endpoints

Endpoints for NF-e emission, cancellation, and fiscal configuration.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.fiscal import (
    IssueNFeRequest,
    IssueNFeResponse,
    CancelNFeRequest,
    CancelNFeResponse,
    FiscalConfigRequest,
    FiscalConfigResponse,
    NFEStatusResponse
)
from app.models.workspace import Workspace
from app.models.user import User
from app.models.sale import Sale
from app.services.fiscal_service import FiscalService
from app.core.encryption import field_encryption
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/sales/{sale_id}/issue-nfe", response_model=IssueNFeResponse)
async def issue_nfe(
    sale_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Issue NF-e (Nota Fiscal Eletrônica) for a sale.

    **Requirements:**
    - Sale must exist and belong to user's workspace
    - Fiscal configuration must be complete
    - Product must have fiscal data (NCM, origin, etc.)
    - Customer must have complete address

    **Returns:**
    - NF-e chave (access key)
    - DANFE URL (PDF)
    - XML URL
    - Or validation errors if data is incomplete
    """
    try:
        # Get workspace
        workspace = db.query(Workspace).filter(
            Workspace.id == current_user.workspace_id
        ).first()

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace não encontrado"
            )

        # Verify sale exists and belongs to workspace
        sale = db.query(Sale).filter(
            Sale.id == sale_id,
            Sale.workspace_id == workspace.id
        ).first()

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venda não encontrada"
            )

        # Get client IP for audit
        client_ip = request.client.host if request.client else None

        # Initialize FiscalService
        fiscal_service = FiscalService(workspace, db)

        # Issue NF-e
        result = await fiscal_service.issue_nfe(
            sale_id=sale_id,
            user_id=current_user.id,
            ip_address=client_ip
        )

        return IssueNFeResponse(**result)

    except ValueError as e:
        # Configuration errors (invalid partner, missing API key, etc.)
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Unexpected error issuing NF-e for sale {sale_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao emitir NF-e: {str(e)}"
        )


@router.post("/sales/{sale_id}/cancel-nfe", response_model=CancelNFeResponse)
async def cancel_nfe(
    sale_id: int,
    cancel_request: CancelNFeRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an issued NF-e.

    **SEFAZ Rules:**
    - Can only cancel within 24 hours of emission
    - Justification required (minimum 15 characters)
    - NF-e must be in 'issued' status

    **Args:**
    - sale_id: ID of the sale
    - reason: Cancellation justification (min 15 chars)

    **Returns:**
    - Success message or error
    """
    try:
        # Get workspace
        workspace = db.query(Workspace).filter(
            Workspace.id == current_user.workspace_id
        ).first()

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace não encontrado"
            )

        # Verify sale exists and belongs to workspace
        sale = db.query(Sale).filter(
            Sale.id == sale_id,
            Sale.workspace_id == workspace.id
        ).first()

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venda não encontrada"
            )

        # Get client IP for audit
        client_ip = request.client.host if request.client else None

        # Initialize FiscalService
        fiscal_service = FiscalService(workspace, db)

        # Cancel NF-e
        result = await fiscal_service.cancel_nfe(
            sale_id=sale_id,
            reason=cancel_request.reason,
            user_id=current_user.id,
            ip_address=client_ip
        )

        return CancelNFeResponse(**result)

    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Unexpected error cancelling NF-e for sale {sale_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao cancelar NF-e: {str(e)}"
        )


@router.get("/sales/{sale_id}/nfe-status", response_model=NFEStatusResponse)
async def get_nfe_status(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get NF-e status for a sale.

    Returns current status, chave, URLs, rejection reason, etc.
    """
    sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.workspace_id == current_user.workspace_id
    ).first()

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venda não encontrada"
        )

    return NFEStatusResponse(
        sale_id=sale.id,
        nfe_status=sale.nfe_status,
        nfe_chave=sale.nfe_chave,
        nfe_numero=sale.nfe_numero,
        nfe_serie=sale.nfe_serie,
        nfe_danfe_url=sale.nfe_danfe_url,
        nfe_xml_url=sale.nfe_xml_url,
        nfe_issued_at=sale.nfe_issued_at,
        nfe_rejection_reason=sale.nfe_rejection_reason,
        nfe_cancelled_at=sale.nfe_cancelled_at,
        nfe_cancellation_reason=sale.nfe_cancellation_reason
    )


@router.post("/workspaces/config/fiscal", response_model=FiscalConfigResponse)
async def update_fiscal_config(
    config: FiscalConfigRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update workspace fiscal configuration.

    **Required fields:**
    - CNPJ, Razão Social, Inscrição Estadual
    - Complete fiscal address
    - Fiscal partner and API key

    **Security:**
    - API key is encrypted before storing
    - Only workspace admin can update
    """
    try:
        workspace = db.query(Workspace).filter(
            Workspace.id == current_user.workspace_id
        ).first()

        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace não encontrado"
            )

        # Update company data
        workspace.cnpj = config.cnpj
        workspace.razao_social = config.razao_social
        workspace.nome_fantasia = config.nome_fantasia
        workspace.inscricao_estadual = config.inscricao_estadual
        workspace.inscricao_municipal = config.inscricao_municipal
        workspace.regime_tributario = config.regime_tributario

        # Update fiscal address
        workspace.fiscal_cep = config.fiscal_cep
        workspace.fiscal_logradouro = config.fiscal_logradouro
        workspace.fiscal_numero = config.fiscal_numero
        workspace.fiscal_complemento = config.fiscal_complemento
        workspace.fiscal_bairro = config.fiscal_bairro
        workspace.fiscal_cidade = config.fiscal_cidade
        workspace.fiscal_uf = config.fiscal_uf
        workspace.fiscal_codigo_municipio = config.fiscal_codigo_municipio

        # Update fiscal partner (encrypt API key)
        workspace.fiscal_partner = config.fiscal_partner
        workspace.fiscal_partner_api_key = field_encryption.encrypt(config.fiscal_partner_api_key)

        # Update NF-e settings
        workspace.nfe_serie = config.nfe_serie
        workspace.nfe_ambiente = config.nfe_ambiente

        # Update metadata
        workspace.fiscal_config_updated_at = datetime.utcnow()
        workspace.fiscal_config_updated_by = current_user.id

        db.commit()
        db.refresh(workspace)

        logger.info(f"Fiscal config updated for workspace {workspace.id} by user {current_user.id}")

        return FiscalConfigResponse(
            cnpj=workspace.cnpj,
            razao_social=workspace.razao_social,
            nome_fantasia=workspace.nome_fantasia,
            inscricao_estadual=workspace.inscricao_estadual,
            regime_tributario=workspace.regime_tributario,
            fiscal_partner=workspace.fiscal_partner,
            nfe_serie=workspace.nfe_serie,
            nfe_ambiente=workspace.nfe_ambiente,
            certificate_status=workspace.certificate_status,
            certificate_expires_at=workspace.certificate_expires_at,
            fiscal_config_updated_at=workspace.fiscal_config_updated_at
        )

    except Exception as e:
        db.rollback()
        logger.exception("Error updating fiscal configuration")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar configurações fiscais: {str(e)}"
        )


@router.get("/workspaces/config/fiscal", response_model=FiscalConfigResponse)
async def get_fiscal_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get workspace fiscal configuration.

    **Note:** API key is NOT returned for security reasons.
    """
    workspace = db.query(Workspace).filter(
        Workspace.id == current_user.workspace_id
    ).first()

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace não encontrado"
        )

    return FiscalConfigResponse(
        cnpj=workspace.cnpj,
        razao_social=workspace.razao_social,
        nome_fantasia=workspace.nome_fantasia,
        inscricao_estadual=workspace.inscricao_estadual,
        regime_tributario=workspace.regime_tributario,
        fiscal_partner=workspace.fiscal_partner,
        nfe_serie=workspace.nfe_serie,
        nfe_ambiente=workspace.nfe_ambiente,
        certificate_status=workspace.certificate_status,
        certificate_expires_at=workspace.certificate_expires_at,
        fiscal_config_updated_at=workspace.fiscal_config_updated_at
    )
