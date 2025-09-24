from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import tempfile
import os
from datetime import datetime

from app.core.database import get_db
from app.models.invoice import Invoice
from app.services.invoice_processor import InvoiceProcessorService
from app.services.document_processor import DocumentProcessor
from app.services.data_cleaner import DataCleaner
from app.services.supplier_matcher import SupplierMatcher
from app.services.ai_service import AIService
from app.core.security import get_current_user
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

    try:
        # Salva arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Processa o documento com o novo processador unificado
        document_processor = DocumentProcessor(db_session=db)

        # Extrai dados do documento (PDF convertido para imagem ou imagem direta)
        processing_result = await document_processor.process_document(temp_file_path, file.filename)

        # Remove arquivo temporário
        os.unlink(temp_file_path)

        # Extrai dados do resultado do processamento
        extracted_data = processing_result.get("extracted_data", {})

        # Prepara resposta com dados extraídos
        response_data = {
            "success": processing_result.get("success", False),
            "message": "Documento processado com sucesso" if processing_result.get("success") else "Erro no processamento",
            "extracted_data": extracted_data,
            "processing_info": {
                "method": processing_result.get("processing_method", "unknown"),
                "confidence_score": processing_result.get("confidence_score", 0.0),
                "pages_processed": processing_result.get("total_pages", processing_result.get("pages_processed", 1)),
                "file_type": processing_result.get("file_type", "unknown"),
                "image_dimensions": processing_result.get("image_dimensions"),
                "pdf_dpi": processing_result.get("pdf_dpi"),
                "cleaning_stats": processing_result.get("cleaning_stats", {}),
                "supplier_suggestions": processing_result.get("supplier_suggestions", {})
            },
            "file_info": {
                "filename": file.filename,
                "original_filename": processing_result.get("original_filename", file.filename),
                "size": file.size,
                "content_type": file.content_type,
                "processed_at": processing_result.get("processed_at", datetime.now().isoformat())
            }
        }

        # Adiciona erro se houver
        if not processing_result.get("success"):
            response_data["error"] = processing_result.get("error", "Erro desconhecido")

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=response_data
        )

    except Exception as e:
        # Remove arquivo temporário em caso de erro
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

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
            user_id=current_user.id,
            supplier_name=invoice_data.get("supplier_name"),
            supplier_cnpj=invoice_data.get("supplier_cnpj"),
            invoice_number=invoice_data.get("invoice_number"),
            issue_date=datetime.fromisoformat(invoice_data.get("issue_date")),
            due_date=datetime.fromisoformat(invoice_data.get("due_date")),
            total_amount=float(invoice_data.get("total_amount", 0)),
            tax_amount=float(invoice_data.get("tax_amount", 0)),
            net_amount=float(invoice_data.get("net_amount", 0)),
            description=invoice_data.get("description"),
            category=invoice_data.get("category"),
            payment_method=invoice_data.get("payment_method"),
            status="pending",
            created_at=datetime.now(),
            updated_at=datetime.now()
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
        query = db.query(Invoice).filter(Invoice.user_id == current_user.id)

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
    raw_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de teste para limpeza e formatação de dados

    - **raw_data**: Dados brutos para testar a limpeza
    """

    try:
        # Inicializa o limpador de dados
        data_cleaner = DataCleaner()

        # Limpa os dados fornecidos
        cleaned_data = data_cleaner.clean_extracted_data(raw_data)

        # Gera estatísticas de limpeza
        cleaning_stats = data_cleaner.get_cleaning_stats(raw_data, cleaned_data)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Limpeza de dados realizada com sucesso",
                "original_data": raw_data,
                "cleaned_data": cleaned_data,
                "cleaning_stats": cleaning_stats,
                "processed_at": datetime.now().isoformat()
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar faturas: {str(e)}"
        )