from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.accounts_payable import (
    Supplier,
    AccountsPayableInvoice,
    InvoiceStatus,
    PaymentHistory,
    InvoiceInstallment
)
from app.schemas.accounts_payable import (
    Supplier as SupplierSchema,
    SupplierCreate,
    SupplierUpdate,
    Invoice as InvoiceSchema,
    InvoiceCreate,
    InvoiceUpdate,
    PaymentCreate,
    Payment as PaymentSchema,
    APAnalyticsSummary,
    APAgingReport,
    APAgingBucket,
    APCompleteAnalytics,
    SupplierSummary,
    APCategoryAnalysis,
)

router = APIRouter()


# ==================== SUPPLIERS ====================

@router.post("/suppliers", response_model=SupplierSchema, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar novo fornecedor"""
    db_supplier = Supplier(
        **supplier.model_dump(),
        workspace_id=current_user.workspace_id,
        created_by=current_user.id
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("/suppliers", response_model=List[SupplierSchema])
def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar fornecedores"""
    query = db.query(Supplier).filter(Supplier.workspace_id == current_user.workspace_id)

    if is_active is not None:
        query = query.filter(Supplier.is_active == is_active)

    if search:
        query = query.filter(
            or_(
                Supplier.name.ilike(f"%{search}%"),
                Supplier.cnpj.ilike(f"%{search}%"),
                Supplier.cpf.ilike(f"%{search}%")
            )
        )

    query = query.order_by(Supplier.name).offset(skip).limit(limit)
    return query.all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierSchema)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter fornecedor por ID"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierSchema)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar fornecedor"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar fornecedor"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Verificar se há invoices vinculadas
    has_invoices = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.supplier_id == supplier_id
    ).count() > 0

    if has_invoices:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete supplier with existing invoices"
        )

    db.delete(supplier)
    db.commit()
    return None


# ==================== INVOICES ====================

@router.post("/invoices", response_model=InvoiceSchema, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Criar nova fatura a pagar"""
    # Verificar se supplier existe
    supplier = db.query(Supplier).filter(
        Supplier.id == invoice.supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db_invoice = AccountsPayableInvoice(
        **invoice.model_dump(),
        workspace_id=current_user.workspace_id,
        created_by=current_user.id
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    return db_invoice


@router.get("/invoices", response_model=List[InvoiceSchema])
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[InvoiceStatus] = None,
    supplier_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    overdue_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar faturas a pagar"""
    query = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(AccountsPayableInvoice.status == status)

    if supplier_id:
        query = query.filter(AccountsPayableInvoice.supplier_id == supplier_id)

    if start_date:
        query = query.filter(AccountsPayableInvoice.due_date >= start_date)

    if end_date:
        query = query.filter(AccountsPayableInvoice.due_date <= end_date)

    if overdue_only:
        query = query.filter(
            AccountsPayableInvoice.due_date < date.today(),
            AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED])
        )

    query = query.order_by(AccountsPayableInvoice.due_date.desc()).offset(skip).limit(limit)
    return query.all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceSchema)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter fatura por ID"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice


@router.put("/invoices/{invoice_id}", response_model=InvoiceSchema)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualizar fatura"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = invoice_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return invoice


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletar fatura"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete paid invoice"
        )

    db.delete(invoice)
    db.commit()
    return None


# ==================== PAYMENTS ====================

@router.post("/invoices/{invoice_id}/payments", response_model=PaymentSchema, status_code=status.HTTP_201_CREATED)
def register_payment(
    invoice_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registrar pagamento de fatura"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Invoice already paid")

    if invoice.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot pay cancelled invoice")

    # Verificar se o valor não excede o saldo devedor
    remaining = invoice.total_value - invoice.paid_value
    if payment.amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount ({payment.amount}) exceeds remaining balance ({remaining})"
        )

    # Criar registro de pagamento
    db_payment = PaymentHistory(
        invoice_id=invoice_id,
        **payment.model_dump(),
        created_by=current_user.id
    )
    db.add(db_payment)

    # Atualizar valores pagos
    invoice.paid_value += payment.amount

    # Atualizar status se totalmente pago
    if invoice.paid_value >= invoice.total_value:
        invoice.status = InvoiceStatus.PAID
        invoice.payment_date = payment.payment_date.date()

    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.get("/invoices/{invoice_id}/payments", response_model=List[PaymentSchema])
def list_invoice_payments(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar pagamentos de uma fatura"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    payments = db.query(PaymentHistory).filter(
        PaymentHistory.invoice_id == invoice_id
    ).order_by(PaymentHistory.payment_date.desc()).all()

    return payments


# ==================== ACTIONS ====================

@router.post("/invoices/{invoice_id}/approve", response_model=InvoiceSchema)
def approve_invoice(
    invoice_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Aprovar fatura para pagamento"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status not in [InvoiceStatus.PENDING, InvoiceStatus.VALIDATED]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve invoice with status {invoice.status}"
        )

    invoice.status = InvoiceStatus.APPROVED
    invoice.approved_by = current_user.id
    invoice.approved_at = datetime.utcnow()
    invoice.approval_notes = notes

    db.commit()
    db.refresh(invoice)
    return invoice


@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceSchema)
def cancel_invoice(
    invoice_id: int,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancelar fatura"""
    invoice = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.id == invoice_id,
        AccountsPayableInvoice.workspace_id == current_user.workspace_id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot cancel paid invoice")

    invoice.status = InvoiceStatus.CANCELLED
    if reason:
        invoice.notes = f"{invoice.notes or ''}\nCancellation reason: {reason}"

    db.commit()
    db.refresh(invoice)
    return invoice


# ==================== ANALYTICS ====================

@router.get("/analytics/summary", response_model=APAnalyticsSummary)
def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter resumo de analytics"""
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    # Total a pagar (faturas abertas)
    total_to_pay = db.query(func.sum(AccountsPayableInvoice.total_value - AccountsPayableInvoice.paid_value)).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED])
    ).scalar() or 0

    # Total vencido
    total_overdue = db.query(func.sum(AccountsPayableInvoice.total_value - AccountsPayableInvoice.paid_value)).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED]),
        AccountsPayableInvoice.due_date < date.today()
    ).scalar() or 0

    # Total vencendo este mês
    month_start = date.today().replace(day=1)
    next_month = (month_start + timedelta(days=32)).replace(day=1)
    total_due_this_month = db.query(func.sum(AccountsPayableInvoice.total_value - AccountsPayableInvoice.paid_value)).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED]),
        AccountsPayableInvoice.due_date >= month_start,
        AccountsPayableInvoice.due_date < next_month
    ).scalar() or 0

    # Total pago este mês
    total_paid_this_month = db.query(func.sum(AccountsPayableInvoice.paid_value)).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status == InvoiceStatus.PAID,
        AccountsPayableInvoice.payment_date >= month_start,
        AccountsPayableInvoice.payment_date < next_month
    ).scalar() or 0

    # Contagens
    count_open = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED])
    ).count()

    count_overdue = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED]),
        AccountsPayableInvoice.due_date < date.today()
    ).count()

    count_paid_this_month = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status == InvoiceStatus.PAID,
        AccountsPayableInvoice.payment_date >= month_start,
        AccountsPayableInvoice.payment_date < next_month
    ).count()

    # Média de dias de pagamento
    paid_invoices = db.query(
        func.avg(
            func.julianday(AccountsPayableInvoice.payment_date) -
            func.julianday(AccountsPayableInvoice.due_date)
        )
    ).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status == InvoiceStatus.PAID,
        AccountsPayableInvoice.payment_date.isnot(None)
    ).scalar()
    avg_payment_days = paid_invoices or 0

    # DPO (Days Payable Outstanding)
    purchases_this_month = db.query(func.sum(AccountsPayableInvoice.total_value)).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.invoice_date >= month_start,
        AccountsPayableInvoice.invoice_date < next_month
    ).scalar() or 1  # Evitar divisão por zero

    dpo = (total_to_pay / purchases_this_month) * 30 if purchases_this_month > 0 else 0

    return APAnalyticsSummary(
        total_to_pay=total_to_pay,
        total_overdue=total_overdue,
        total_due_this_month=total_due_this_month,
        total_paid_this_month=total_paid_this_month,
        count_open=count_open,
        count_overdue=count_overdue,
        count_paid_this_month=count_paid_this_month,
        avg_payment_days=round(avg_payment_days, 2),
        dpo=round(dpo, 2)
    )


@router.get("/analytics/aging", response_model=APAgingReport)
def get_aging_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obter relatório de aging"""
    today = date.today()

    # Buscar todas as faturas abertas
    invoices = db.query(AccountsPayableInvoice).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.status.in_([InvoiceStatus.PENDING, InvoiceStatus.VALIDATED, InvoiceStatus.APPROVED])
    ).all()

    # Categorizar por aging
    buckets = {
        "current": {"count": 0, "value": 0},
        "1-30": {"count": 0, "value": 0},
        "31-60": {"count": 0, "value": 0},
        "61-90": {"count": 0, "value": 0},
        "90+": {"count": 0, "value": 0},
    }

    total_payables = 0

    for inv in invoices:
        remaining = inv.total_value - inv.paid_value
        total_payables += remaining
        days_overdue = (today - inv.due_date).days

        if days_overdue < 0:
            buckets["current"]["count"] += 1
            buckets["current"]["value"] += remaining
        elif days_overdue <= 30:
            buckets["1-30"]["count"] += 1
            buckets["1-30"]["value"] += remaining
        elif days_overdue <= 60:
            buckets["31-60"]["count"] += 1
            buckets["31-60"]["value"] += remaining
        elif days_overdue <= 90:
            buckets["61-90"]["count"] += 1
            buckets["61-90"]["value"] += remaining
        else:
            buckets["90+"]["count"] += 1
            buckets["90+"]["value"] += remaining

    # Converter para schema
    aging_buckets = [
        APAgingBucket(
            range="A Vencer",
            count=buckets["current"]["count"],
            total_value=buckets["current"]["value"],
            percentage=round((buckets["current"]["value"] / total_payables * 100), 2) if total_payables > 0 else 0
        ),
        APAgingBucket(
            range="1-30 dias",
            count=buckets["1-30"]["count"],
            total_value=buckets["1-30"]["value"],
            percentage=round((buckets["1-30"]["value"] / total_payables * 100), 2) if total_payables > 0 else 0
        ),
        APAgingBucket(
            range="31-60 dias",
            count=buckets["31-60"]["count"],
            total_value=buckets["31-60"]["value"],
            percentage=round((buckets["31-60"]["value"] / total_payables * 100), 2) if total_payables > 0 else 0
        ),
        APAgingBucket(
            range="61-90 dias",
            count=buckets["61-90"]["count"],
            total_value=buckets["61-90"]["value"],
            percentage=round((buckets["61-90"]["value"] / total_payables * 100), 2) if total_payables > 0 else 0
        ),
        APAgingBucket(
            range="90+ dias",
            count=buckets["90+"]["count"],
            total_value=buckets["90+"]["value"],
            percentage=round((buckets["90+"]["value"] / total_payables * 100), 2) if total_payables > 0 else 0
        ),
    ]

    return APAgingReport(
        report_date=today.isoformat(),
        total_payables=total_payables,
        buckets=aging_buckets
    )


@router.get("/analytics/by-category", response_model=List[APCategoryAnalysis])
def get_by_category(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Análise por categoria"""
    if not start_date:
        start_date = date.today().replace(day=1)
    if not end_date:
        end_date = date.today()

    # Agrupar por categoria
    results = db.query(
        AccountsPayableInvoice.category,
        func.sum(AccountsPayableInvoice.total_value).label("total"),
        func.count(AccountsPayableInvoice.id).label("count")
    ).filter(
        AccountsPayableInvoice.workspace_id == current_user.workspace_id,
        AccountsPayableInvoice.invoice_date >= start_date,
        AccountsPayableInvoice.invoice_date <= end_date
    ).group_by(AccountsPayableInvoice.category).all()

    total_value = sum(r.total for r in results)

    return [
        APCategoryAnalysis(
            category=r.category or "Sem Categoria",
            total_value=r.total,
            count=r.count,
            percentage=round((r.total / total_value * 100), 2) if total_value > 0 else 0
        )
        for r in results
    ]


# ==================== ADMIN - TEMPORARY MIGRATION ENDPOINT ====================

@router.post("/admin/run-migration")
def run_migration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ENDPOINT TEMPORÁRIO - Executar migration_014_fix.sql
    REMOVER APÓS USO!
    """
    import os
    from pathlib import Path

    # Verificar se usuário é admin (adicionar validação se necessário)
    # Por enquanto, qualquer usuário autenticado pode executar

    migration_file = Path(__file__).parent.parent.parent.parent / "migrations" / "migration_014_fix.sql"

    if not migration_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Arquivo de migration não encontrado: {migration_file}"
        )

    try:
        # Ler arquivo SQL
        with open(migration_file, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Executar SQL
        db.execute(sql_content)
        db.commit()

        # Verificar tabelas criadas
        result = db.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('suppliers', 'accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts')
            ORDER BY table_name
        """)
        tables = [row[0] for row in result]

        return {
            "success": True,
            "message": "Migration executada com sucesso!",
            "tables_created": tables,
            "total_tables": len(tables)
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao executar migration: {str(e)}"
        )
