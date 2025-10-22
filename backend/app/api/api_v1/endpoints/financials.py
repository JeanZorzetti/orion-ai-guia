from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os
from datetime import datetime

from app.core.database import get_db
from app.models.invoice_model import Invoice
# Temporariamente comentado - services de IA serão implementados na Fase 2
# from app.services.invoice_processor import InvoiceProcessorService
# from app.services.document_processor import DocumentProcessor
# from app.services.data_cleaner import DataCleaner
# from app.services.supplier_matcher import SupplierMatcher
# from app.services.ai_service import AIService
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

# Tipos de arquivo permitidos
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file: UploadFile) -> bool:
    """Valida se o arquivo está dentro dos critérios aceitos"""
    if not file.filename:
        return False

    # Verifica extensão
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False

    # Verifica tipo MIME
    allowed_mimes = {
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    }

    if file.content_type not in allowed_mimes:
        return False

    return True

@router.post("/invoices/upload")
async def upload_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload e processamento de fatura com IA

    - **file**: Arquivo da fatura (PDF, JPG, PNG)
    - Retorna os dados extraídos pela IA para validação
    """

    # Validação do arquivo
    if not validate_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não suportado. Formatos aceitos: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Verifica tamanho do arquivo
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # TODO: Implementar processamento de IA na Fase 2
    # Por enquanto retorna mock data para o backend iniciar
    try:
        # Mock response - IA será implementada depois
        response_data = {
            "success": True,
            "message": "Endpoint disponível - Processamento de IA será implementado na Fase 2",
            "extracted_data": {
                "supplier": {"name": "Mock Supplier", "document": "00.000.000/0000-00"},
                "invoice": {"number": "MOCK-001", "date": datetime.now().isoformat()},
                "financial": {"totalValue": 1000.00, "netValue": 850.00, "taxValue": 150.00}
            },
            "file_info": {
                "filename": file.filename,
                "size": file.size,
                "content_type": file.content_type,
                "processed_at": datetime.now().isoformat()
            }
        }

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response_data
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar fatura: {str(e)}"
        )

@router.post("/invoices/save")
async def save_invoice(
    invoice_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Salva a fatura validada pelo usuário no banco de dados

    - **invoice_data**: Dados da fatura validados pelo usuário
    """

    try:
        # Cria nova instância da fatura
        new_invoice = Invoice(
            workspace_id=current_user.workspace_id,
            invoice_number=invoice_data.get("invoice_number"),
            invoice_date=datetime.fromisoformat(invoice_data.get("issue_date")).date(),
            due_date=datetime.fromisoformat(invoice_data.get("due_date")).date() if invoice_data.get("due_date") else None,
            total_value=float(invoice_data.get("total_amount", 0)),
            tax_value=float(invoice_data.get("tax_amount", 0)),
            net_value=float(invoice_data.get("net_amount", 0)),
            description=invoice_data.get("description"),
            category=invoice_data.get("category"),
            status="pending"
        )

        # Salva no banco de dados
        db.add(new_invoice)
        db.commit()
        db.refresh(new_invoice)

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "success": True,
                "message": "Fatura salva com sucesso",
                "invoice_id": new_invoice.id,
                "status": new_invoice.status
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar fatura: {str(e)}"
        )

@router.get("/invoices")
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista as faturas do usuário com filtros opcionais
    """

    try:
        query = db.query(Invoice).filter(Invoice.workspace_id == current_user.workspace_id)

        if status_filter:
            query = query.filter(Invoice.status == status_filter)

        invoices = query.offset(skip).limit(limit).all()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "invoices": [
                    {
                        "id": invoice.id,
                        "supplier_name": invoice.supplier_name,
                        "invoice_number": invoice.invoice_number,
                        "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                        "total_amount": float(invoice.total_amount) if invoice.total_amount else 0,
                        "status": invoice.status,
                        "created_at": invoice.created_at.isoformat() if invoice.created_at else None
                    }
                    for invoice in invoices
                ]
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar faturas: {str(e)}"
        )

@router.post("/test-data-cleaning")
async def test_data_cleaning(
    raw_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de teste para limpeza e formatação de dados
    TODO: Implementar DataCleaner na Fase 2
    """

    # Mock response por enquanto
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Endpoint disponível - DataCleaner será implementado na Fase 2",
            "original_data": raw_data,
            "cleaned_data": raw_data,  # Mock - retorna os mesmos dados
            "processed_at": datetime.now().isoformat()
        }
    )