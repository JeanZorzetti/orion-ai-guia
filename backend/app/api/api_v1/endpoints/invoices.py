from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.invoice_model import Invoice
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse

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
