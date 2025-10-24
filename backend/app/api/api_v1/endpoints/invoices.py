from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import time
from pathlib import Path
import tempfile

from app.core.database import get_db
from app.models.invoice_model import Invoice
from app.models.supplier_model import Supplier
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceExtractionResponse,
    ExtractedData,
    ExtractionSuggestions,
    ConfidenceScores,
    SupplierMatch
)
from app.services.invoice_processor import InvoiceProcessorService
from app.services.ai_service import AIService
from app.services.supplier_matcher import SupplierMatcher

router = APIRouter()


@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    supplier_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as faturas do workspace (multi-tenant)
    """
    query = db.query(Invoice).filter(Invoice.workspace_id == current_user.workspace_id)

    if status_filter:
        query = query.filter(Invoice.status == status_filter)

    if supplier_id:
        query = query.filter(Invoice.supplier_id == supplier_id)

    invoices = query.order_by(Invoice.invoice_date.desc()).offset(skip).limit(limit).all()
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de uma fatura específica (multi-tenant)
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )

    return invoice


@router.post("/", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova fatura no workspace do usuário
    """
    db_invoice = Invoice(
        **invoice.model_dump(),
        workspace_id=current_user.workspace_id,
        status="pending"
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza uma fatura existente (multi-tenant)
    """
    db_invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.workspace_id == current_user.workspace_id
    ).first()

    if not db_invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )

    # Atualiza apenas os campos fornecidos
    update_data = invoice_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_invoice, field, value)

    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta uma fatura (multi-tenant)
    """
    db_invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.workspace_id == current_user.workspace_id
    ).first()

    if not db_invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada"
        )

    db.delete(db_invoice)
    db.commit()
    return None


@router.post("/upload", response_model=InvoiceExtractionResponse)
async def upload_and_extract_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload de fatura (PDF/Imagem) com extração automática de dados usando IA

    Este endpoint processa o arquivo enviado usando:
    - LayoutLM para extração estruturada de documentos
    - OCR (Tesseract) como fallback
    - Fuzzy matching para identificar fornecedores existentes

    Args:
        file: Arquivo PDF ou imagem (JPG, PNG)

    Returns:
        InvoiceExtractionResponse com dados extraídos e sugestões
    """

    start_time = time.time()

    # Validação do tipo de arquivo
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não suportado. Use: {', '.join(allowed_extensions)}"
        )

    # Validação do tamanho (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file_size = 0
    temp_file_path = None

    try:
        # Salva arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file_path = temp_file.name

            # Lê e salva o arquivo em chunks
            while chunk := await file.read(8192):
                file_size += len(chunk)
                if file_size > max_size:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Arquivo muito grande. Tamanho máximo: 10MB"
                    )
                temp_file.write(chunk)

        # Inicializa serviços
        ai_service = AIService()
        invoice_processor = InvoiceProcessorService(ai_service)
        supplier_matcher = SupplierMatcher(db)

        # Processa a fatura com IA
        extraction_result = await invoice_processor.process_invoice(
            temp_file_path,
            file.filename
        )

        # Calcula confidence scores
        overall_confidence = extraction_result.get("confidence_score", 0.0)
        confidence_scores = ConfidenceScores(
            invoice_number=min(overall_confidence + 0.1, 1.0),  # Ajustes por campo
            supplier_name=overall_confidence,
            total_value=min(overall_confidence + 0.05, 1.0),
            due_date=max(overall_confidence - 0.1, 0.0),
            invoice_date=max(overall_confidence - 0.1, 0.0)
        )

        # Fuzzy matching de fornecedores
        supplier_name = extraction_result.get("supplier_name", "")
        supplier_cnpj = extraction_result.get("supplier_cnpj", "")

        supplier_matches = []
        suggested_supplier_id = None

        if supplier_name:
            matches = supplier_matcher.find_matching_suppliers(
                supplier_name=supplier_name,
                supplier_cnpj=supplier_cnpj,
                limit=3
            )

            for match in matches:
                supplier_matches.append(SupplierMatch(
                    id=match.get('supplier_id') or 0,
                    name=match.get('name', ''),
                    cnpj=match.get('cnpj'),
                    score=match.get('score', 0.0),
                    match_reason=match.get('match_reason', ''),
                    match_type=match.get('match_type', '')
                ))

            # Usa o primeiro match como sugestão se score >= 80
            if supplier_matches and supplier_matches[0].score >= 80:
                suggested_supplier_id = supplier_matches[0].id

        # Monta dados extraídos
        extracted_data = ExtractedData(
            invoice_number=extraction_result.get("invoice_number", ""),
            supplier_name=supplier_name,
            supplier_cnpj=supplier_cnpj,
            supplier_matches=supplier_matches,
            total_value=float(extraction_result.get("total_amount", 0.0)),
            tax_value=float(extraction_result.get("tax_amount", 0.0)),
            net_value=float(extraction_result.get("net_amount", 0.0)),
            due_date=extraction_result.get("due_date"),
            invoice_date=extraction_result.get("issue_date"),
            category=extraction_result.get("category"),
            description=extraction_result.get("description"),
            confidence=confidence_scores
        )

        # Gera warnings e sugestões
        warnings = []
        needs_review = False

        # Verifica confidence baixa
        avg_confidence = (
            confidence_scores.invoice_number +
            confidence_scores.supplier_name +
            confidence_scores.total_value +
            confidence_scores.due_date
        ) / 4

        if avg_confidence < 0.8:
            needs_review = True
            warnings.append("Confiança média na extração - recomenda-se verificação manual")

        if not supplier_matches:
            warnings.append("Nenhum fornecedor correspondente encontrado - será necessário criar novo")
        elif supplier_matches[0].score < 90:
            warnings.append(f"Match de fornecedor com {supplier_matches[0].score:.0f}% de similaridade - verifique se está correto")

        if not extracted_data.due_date:
            warnings.append("Data de vencimento não encontrada - preencha manualmente")

        if extracted_data.total_value == 0:
            warnings.append("Valor total não detectado - preencha manualmente")
            needs_review = True

        # Sugestões finais
        suggestions = ExtractionSuggestions(
            supplier_id=suggested_supplier_id,
            needs_review=needs_review,
            warnings=warnings
        )

        # Calcula tempo de processamento
        processing_time = int((time.time() - start_time) * 1000)

        return InvoiceExtractionResponse(
            extracted_data=extracted_data,
            suggestions=suggestions,
            processing_time_ms=processing_time,
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        # Retorna erro formatado
        processing_time = int((time.time() - start_time) * 1000)
        return InvoiceExtractionResponse(
            extracted_data=ExtractedData(
                confidence=ConfidenceScores(
                    invoice_number=0.0,
                    supplier_name=0.0,
                    total_value=0.0,
                    due_date=0.0
                )
            ),
            suggestions=ExtractionSuggestions(
                needs_review=True,
                warnings=[f"Erro no processamento: {str(e)}"]
            ),
            processing_time_ms=processing_time,
            success=False,
            error=str(e)
        )
    finally:
        # Remove arquivo temporário
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass
