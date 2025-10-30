from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta, date

from app.core.database import get_db
from app.models.accounts_receivable import AccountsReceivable
from app.models.sale import Sale
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.accounts_receivable import (
    AccountsReceivableCreate,
    AccountsReceivableUpdate,
    AccountsReceivableResponse,
    ReceivePaymentRequest,
    PartialPaymentRequest,
    ARAnalyticsSummary,
    ARAgingReport,
    AgingBucket,
    CustomerReceivablesSummary,
    ARTrend,
)

router = APIRouter()


# ============================================
# CRUD Endpoints
# ============================================

@router.get("/", response_model=List[AccountsReceivableResponse])
def get_accounts_receivable(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    risk_category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    overdue_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as contas a receber do workspace (multi-tenant).

    Filtros disponíveis:
    - status: pendente, parcial, recebido, vencido, cancelado
    - customer_id: ID do cliente
    - customer_name: Nome do cliente (busca parcial)
    - risk_category: excelente, bom, regular, ruim, critico
    - start_date: Data inicial (due_date)
    - end_date: Data final (due_date)
    - overdue_only: Apenas vencidas
    """
    query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id
    )

    # Aplicar filtros
    if status:
        query = query.filter(AccountsReceivable.status == status)

    if customer_id:
        query = query.filter(AccountsReceivable.customer_id == customer_id)

    if customer_name:
        query = query.filter(AccountsReceivable.customer_name.ilike(f"%{customer_name}%"))

    if risk_category:
        query = query.filter(AccountsReceivable.risk_category == risk_category)

    if start_date:
        query = query.filter(AccountsReceivable.due_date >= start_date)

    if end_date:
        query = query.filter(AccountsReceivable.due_date <= end_date)

    if overdue_only:
        today = datetime.now().date()
        query = query.filter(
            AccountsReceivable.due_date < today,
            AccountsReceivable.status.in_(['pendente', 'parcial', 'vencido'])
        )

    # Ordenar por data de vencimento (mais antigas primeiro)
    receivables = query.order_by(AccountsReceivable.due_date.asc()).offset(skip).limit(limit).all()

    # Adicionar propriedades computadas
    for receivable in receivables:
        receivable.remaining_value = receivable.remaining_value
        receivable.payment_percentage = receivable.payment_percentage
        receivable.is_overdue = receivable.is_overdue
        receivable.is_fully_paid = receivable.is_fully_paid

    return receivables


@router.get("/{receivable_id}", response_model=AccountsReceivableResponse)
def get_accounts_receivable_by_id(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de uma conta a receber específica (multi-tenant).
    """
    receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id,
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).first()

    if not receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )

    # Adicionar propriedades computadas
    receivable.remaining_value = receivable.remaining_value
    receivable.payment_percentage = receivable.payment_percentage
    receivable.is_overdue = receivable.is_overdue
    receivable.is_fully_paid = receivable.is_fully_paid

    return receivable


@router.post("/", response_model=AccountsReceivableResponse, status_code=status.HTTP_201_CREATED)
def create_accounts_receivable(
    receivable: AccountsReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova conta a receber no workspace do usuário.
    """
    # Verificar se document_number já existe no workspace
    existing = db.query(AccountsReceivable).filter(
        AccountsReceivable.document_number == receivable.document_number,
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma conta a receber com o número {receivable.document_number}"
        )

    db_receivable = AccountsReceivable(
        **receivable.model_dump(),
        workspace_id=current_user.workspace_id,
        status="pendente",
        paid_value=0.0,
        discount_value=0.0,
        interest_value=0.0,
        days_overdue=0,
        reminder_count=0,
        created_by=current_user.id
    )

    db.add(db_receivable)
    db.commit()
    db.refresh(db_receivable)

    # Adicionar propriedades computadas
    db_receivable.remaining_value = db_receivable.remaining_value
    db_receivable.payment_percentage = db_receivable.payment_percentage
    db_receivable.is_overdue = db_receivable.is_overdue
    db_receivable.is_fully_paid = db_receivable.is_fully_paid

    return db_receivable


@router.patch("/{receivable_id}", response_model=AccountsReceivableResponse)
def update_accounts_receivable(
    receivable_id: int,
    receivable_update: AccountsReceivableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza uma conta a receber existente (multi-tenant).
    """
    db_receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id,
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).first()

    if not db_receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )

    # Atualiza apenas os campos fornecidos
    update_data = receivable_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_receivable, field, value)

    db_receivable.updated_by = current_user.id

    db.commit()
    db.refresh(db_receivable)

    # Adicionar propriedades computadas
    db_receivable.remaining_value = db_receivable.remaining_value
    db_receivable.payment_percentage = db_receivable.payment_percentage
    db_receivable.is_overdue = db_receivable.is_overdue
    db_receivable.is_fully_paid = db_receivable.is_fully_paid

    return db_receivable


@router.delete("/{receivable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_accounts_receivable(
    receivable_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta uma conta a receber (multi-tenant).
    Apenas contas pendentes ou canceladas podem ser deletadas.
    """
    db_receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id,
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).first()

    if not db_receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )

    if db_receivable.status not in ['pendente', 'cancelado']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Apenas contas pendentes ou canceladas podem ser deletadas"
        )

    db.delete(db_receivable)
    db.commit()
    return None


# ============================================
# Payment Actions
# ============================================

@router.post("/{receivable_id}/receive", response_model=AccountsReceivableResponse)
def receive_payment(
    receivable_id: int,
    payment: ReceivePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registra o recebimento completo ou parcial de uma conta a receber.
    """
    db_receivable = db.query(AccountsReceivable).filter(
        AccountsReceivable.id == receivable_id,
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).first()

    if not db_receivable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta a receber não encontrada"
        )

    if db_receivable.status in ['recebido', 'cancelado']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta conta já foi recebida ou está cancelada"
        )

    # Atualizar valores
    db_receivable.paid_value += payment.paid_value
    db_receivable.discount_value = payment.discount_value or 0.0
    db_receivable.interest_value = payment.interest_value or 0.0
    db_receivable.payment_date = payment.payment_date

    if payment.payment_method:
        db_receivable.payment_method = payment.payment_method

    if payment.payment_account:
        db_receivable.payment_account = payment.payment_account

    if payment.notes:
        current_notes = db_receivable.notes or ""
        db_receivable.notes = f"{current_notes}\n[Pagamento {payment.payment_date}]: {payment.notes}"

    # Calcular valor líquido
    db_receivable.net_value = (
        db_receivable.value
        + db_receivable.interest_value
        - db_receivable.discount_value
    )

    # Atualizar status
    if db_receivable.paid_value >= db_receivable.value:
        db_receivable.status = "recebido"
    elif db_receivable.paid_value > 0:
        db_receivable.status = "parcial"

    db_receivable.updated_by = current_user.id

    db.commit()
    db.refresh(db_receivable)

    # Adicionar propriedades computadas
    db_receivable.remaining_value = db_receivable.remaining_value
    db_receivable.payment_percentage = db_receivable.payment_percentage
    db_receivable.is_overdue = db_receivable.is_overdue
    db_receivable.is_fully_paid = db_receivable.is_fully_paid

    return db_receivable


@router.post("/{receivable_id}/partial-payment", response_model=AccountsReceivableResponse)
def partial_payment(
    receivable_id: int,
    payment: PartialPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registra um pagamento parcial.
    """
    # Reusar a lógica de receive_payment
    full_payment = ReceivePaymentRequest(
        paid_value=payment.partial_value,
        payment_date=payment.payment_date,
        payment_method=payment.payment_method,
        payment_account=payment.payment_account,
        discount_value=0.0,
        interest_value=0.0,
        notes=payment.notes
    )
    return receive_payment(receivable_id, full_payment, db, current_user)


# ============================================
# Analytics Endpoints
# ============================================

@router.get("/analytics/summary", response_model=ARAnalyticsSummary)
def get_analytics_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna um resumo analítico das contas a receber.
    """
    query = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id
    )

    if start_date:
        query = query.filter(AccountsReceivable.issue_date >= start_date)
    if end_date:
        query = query.filter(AccountsReceivable.issue_date <= end_date)

    receivables = query.all()
    today = datetime.now().date()

    # Calcular métricas
    total_to_receive = sum(r.remaining_value for r in receivables if r.status in ['pendente', 'parcial', 'vencido'])
    total_received = sum(r.paid_value for r in receivables)
    total_overdue = sum(r.remaining_value for r in receivables if r.is_overdue and r.status != 'recebido')
    overdue_count = len([r for r in receivables if r.is_overdue and r.status != 'recebido'])
    pending_count = len([r for r in receivables if r.status in ['pendente', 'parcial']])

    # DSO (Days Sales Outstanding)
    received = [r for r in receivables if r.status == 'recebido' and r.payment_date]
    if received:
        days_to_receive = [(r.payment_date - r.issue_date).days for r in received]
        average_days_to_receive = sum(days_to_receive) / len(days_to_receive)
    else:
        average_days_to_receive = 0.0

    # Taxa de inadimplência
    total_value = sum(r.value for r in receivables)
    default_rate = (total_overdue / total_value * 100) if total_value > 0 else 0.0

    # Total por status
    total_by_status = {}
    for r in receivables:
        total_by_status[r.status] = total_by_status.get(r.status, 0) + r.remaining_value

    # Total por risco
    total_by_risk = {}
    for r in receivables:
        if r.risk_category:
            total_by_risk[r.risk_category] = total_by_risk.get(r.risk_category, 0) + r.remaining_value

    return ARAnalyticsSummary(
        total_to_receive=total_to_receive,
        total_received=total_received,
        total_overdue=total_overdue,
        overdue_count=overdue_count,
        pending_count=pending_count,
        average_days_to_receive=average_days_to_receive,
        default_rate=default_rate,
        total_by_status=total_by_status,
        total_by_risk=total_by_risk
    )


@router.get("/analytics/aging", response_model=ARAgingReport)
def get_aging_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o relatório de aging (envelhecimento) das contas a receber.
    Buckets: 0-30 dias, 31-60 dias, 61-90 dias, 90+ dias
    """
    receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id,
        AccountsReceivable.status.in_(['pendente', 'parcial', 'vencido'])
    ).all()

    today = datetime.now().date()
    total_value = sum(r.remaining_value for r in receivables)

    # Definir buckets
    buckets_data = [
        {"range": "0-30 dias (Atual)", "min": 0, "max": 30},
        {"range": "31-60 dias", "min": 31, "max": 60},
        {"range": "61-90 dias", "min": 61, "max": 90},
        {"range": "90+ dias (Crítico)", "min": 91, "max": None},
    ]

    buckets = []
    for bucket_def in buckets_data:
        bucket_receivables = []
        for r in receivables:
            days_diff = (today - r.due_date).days
            if bucket_def["max"] is None:
                if days_diff >= bucket_def["min"]:
                    bucket_receivables.append(r)
            else:
                if bucket_def["min"] <= days_diff <= bucket_def["max"]:
                    bucket_receivables.append(r)

        bucket_value = sum(r.remaining_value for r in bucket_receivables)
        bucket_percentage = (bucket_value / total_value * 100) if total_value > 0 else 0

        buckets.append(AgingBucket(
            range=bucket_def["range"],
            min_days=bucket_def["min"],
            max_days=bucket_def["max"],
            value=bucket_value,
            count=len(bucket_receivables),
            percentage=bucket_percentage
        ))

    return ARAgingReport(
        total_value=total_value,
        buckets=buckets,
        generated_at=datetime.now()
    )


@router.get("/analytics/by-customer", response_model=List[CustomerReceivablesSummary])
def get_by_customer(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna resumo de contas a receber agrupadas por cliente.
    Ordenado por valor total pendente (maiores primeiro).
    """
    receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id
    ).all()

    # Agrupar por cliente
    customers_dict = {}
    for r in receivables:
        key = (r.customer_name, r.customer_document)
        if key not in customers_dict:
            customers_dict[key] = []
        customers_dict[key].append(r)

    # Calcular resumos
    summaries = []
    for (customer_name, customer_document), customer_receivables in customers_dict.items():
        total_value = sum(r.value for r in customer_receivables)
        total_paid = sum(r.paid_value for r in customer_receivables)
        total_pending = sum(r.remaining_value for r in customer_receivables if r.status in ['pendente', 'parcial'])
        total_overdue = sum(r.remaining_value for r in customer_receivables if r.is_overdue and r.status != 'recebido')

        # Calcular dias médios de atraso
        overdue_receivables = [r for r in customer_receivables if r.is_overdue]
        if overdue_receivables:
            avg_days_overdue = sum(r.days_overdue for r in overdue_receivables) / len(overdue_receivables)
        else:
            avg_days_overdue = 0.0

        # Determinar categoria de risco (pior risco encontrado)
        risk_hierarchy = ['critico', 'ruim', 'regular', 'bom', 'excelente']
        risk_category = None
        for risk in risk_hierarchy:
            if any(r.risk_category == risk for r in customer_receivables):
                risk_category = risk
                break

        summaries.append(CustomerReceivablesSummary(
            customer_name=customer_name,
            customer_document=customer_document,
            total_receivables=len(customer_receivables),
            total_value=total_value,
            total_paid=total_paid,
            total_pending=total_pending,
            total_overdue=total_overdue,
            risk_category=risk_category,
            average_days_overdue=avg_days_overdue
        ))

    # Ordenar por total pendente (maiores primeiro)
    summaries.sort(key=lambda x: x.total_pending, reverse=True)

    return summaries[:limit]


@router.get("/analytics/overdue", response_model=List[AccountsReceivableResponse])
def get_overdue_receivables(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna contas a receber vencidas, ordenadas por dias de atraso (maiores primeiro).
    """
    today = datetime.now().date()
    receivables = db.query(AccountsReceivable).filter(
        AccountsReceivable.workspace_id == current_user.workspace_id,
        AccountsReceivable.due_date < today,
        AccountsReceivable.status.in_(['pendente', 'parcial', 'vencido'])
    ).order_by(AccountsReceivable.due_date.asc()).limit(limit).all()

    # Calcular days_overdue para cada conta
    for r in receivables:
        r.days_overdue = (today - r.due_date).days
        r.remaining_value = r.remaining_value
        r.payment_percentage = r.payment_percentage
        r.is_overdue = r.is_overdue
        r.is_fully_paid = r.is_fully_paid

    return receivables
