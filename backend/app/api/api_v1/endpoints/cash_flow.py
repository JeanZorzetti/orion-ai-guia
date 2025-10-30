"""
Endpoints REST para Fluxo de Caixa (Cash Flow) e Contas Bancárias

Fornece APIs para gerenciamento de:
- Contas Bancárias (CRUD)
- Movimentações Financeiras (CRUD)
- Transferências entre Contas
- Analytics e Projeções
- Relatórios Financeiros

Fase: 2.1 e 2.2 - Sprint Backend Cash Flow
Referência: roadmaps/ROADMAP_FINANCEIRO_INTEGRACAO.md
Autor: Sistema Orion ERP
Data: 2025-01-30
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract, case
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.models.cash_flow import BankAccount, CashFlowTransaction, TransactionType
from app.schemas.cash_flow import (
    # Bank Account
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountResponse,
    AccountBalanceSummary,
    # Cash Flow Transaction
    CashFlowTransactionCreate,
    CashFlowTransactionUpdate,
    CashFlowTransactionResponse,
    TransferRequest,
    TransferResponse,
    # Analytics
    CashFlowSummary,
    CategorySummary,
    BalanceHistory,
    CashFlowProjection,
    CashFlowAnalytics,
    TransactionTypeEnum,
)

router = APIRouter()


# ============================================
# BANK ACCOUNTS ENDPOINTS
# ============================================

@router.post("/bank-accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def create_bank_account(
    account: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar nova conta bancária

    Cria uma nova conta bancária ou caixa para controle financeiro.
    """
    db_account = BankAccount(
        **account.dict(),
        workspace_id=current_user.workspace_id,
        current_balance=account.initial_balance or 0.0,
        created_by=current_user.id,
        updated_by=current_user.id
    )

    db.add(db_account)
    db.commit()
    db.refresh(db_account)

    return db_account


@router.get("/bank-accounts", response_model=List[BankAccountResponse])
def get_bank_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(True, description="Retornar apenas contas ativas"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar contas bancárias

    Retorna lista de contas bancárias do workspace com filtros opcionais.
    """
    query = db.query(BankAccount).filter(
        BankAccount.workspace_id == current_user.workspace_id
    )

    if active_only:
        query = query.filter(BankAccount.is_active == True)

    query = query.order_by(BankAccount.bank_name, BankAccount.created_at.desc())
    accounts = query.offset(skip).limit(limit).all()

    return accounts


@router.get("/bank-accounts/{account_id}", response_model=BankAccountResponse)
def get_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar conta bancária por ID

    Retorna detalhes de uma conta bancária específica.
    """
    account = db.query(BankAccount).filter(
        and_(
            BankAccount.id == account_id,
            BankAccount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bank account with id {account_id} not found"
        )

    return account


@router.patch("/bank-accounts/{account_id}", response_model=BankAccountResponse)
def update_bank_account(
    account_id: int,
    account_update: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar conta bancária

    Atualiza informações de uma conta bancária. Saldo é atualizado apenas via transações.
    """
    db_account = db.query(BankAccount).filter(
        and_(
            BankAccount.id == account_id,
            BankAccount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bank account with id {account_id} not found"
        )

    update_data = account_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)

    db_account.updated_by = current_user.id
    db_account.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_account)

    return db_account


@router.delete("/bank-accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar conta bancária

    Remove uma conta bancária. Apenas contas sem transações podem ser deletadas.
    """
    db_account = db.query(BankAccount).filter(
        and_(
            BankAccount.id == account_id,
            BankAccount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bank account with id {account_id} not found"
        )

    # Verificar se há transações associadas
    transaction_count = db.query(func.count(CashFlowTransaction.id)).filter(
        CashFlowTransaction.account_id == account_id
    ).scalar()

    if transaction_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete account with {transaction_count} transactions. Deactivate it instead."
        )

    db.delete(db_account)
    db.commit()

    return None


# ============================================
# CASH FLOW TRANSACTIONS ENDPOINTS
# ============================================

@router.post("/transactions", response_model=CashFlowTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: CashFlowTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Criar movimentação financeira

    Registra uma entrada ou saída de caixa. Atualiza automaticamente o saldo da conta.
    """
    # Validar conta bancária
    if transaction.account_id:
        account = db.query(BankAccount).filter(
            and_(
                BankAccount.id == transaction.account_id,
                BankAccount.workspace_id == current_user.workspace_id
            )
        ).first()

        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bank account with id {transaction.account_id} not found"
            )

    # Criar transação
    db_transaction = CashFlowTransaction(
        **transaction.dict(),
        workspace_id=current_user.workspace_id,
        created_by=current_user.id,
        updated_by=current_user.id
    )

    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # Atualizar saldo da conta
    if transaction.account_id:
        _update_account_balance(db, transaction.account_id, transaction.value, transaction.type.value, add=True)

    return db_transaction


@router.get("/transactions", response_model=List[CashFlowTransactionResponse])
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[date] = Query(None, description="Data inicial"),
    end_date: Optional[date] = Query(None, description="Data final"),
    type: Optional[TransactionTypeEnum] = Query(None, description="Tipo de transação"),
    category: Optional[str] = Query(None, description="Categoria"),
    account_id: Optional[int] = Query(None, description="ID da conta"),
    is_reconciled: Optional[bool] = Query(None, description="Filtrar por reconciliação"),
    search: Optional[str] = Query(None, description="Busca textual"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar movimentações financeiras

    Retorna lista de transações com filtros opcionais.
    """
    query = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.workspace_id == current_user.workspace_id
    )

    # Aplicar filtros
    if start_date:
        query = query.filter(CashFlowTransaction.transaction_date >= datetime.combine(start_date, datetime.min.time()))

    if end_date:
        query = query.filter(CashFlowTransaction.transaction_date <= datetime.combine(end_date, datetime.max.time()))

    if type:
        query = query.filter(CashFlowTransaction.type == type.value)

    if category:
        query = query.filter(CashFlowTransaction.category == category)

    if account_id:
        query = query.filter(CashFlowTransaction.account_id == account_id)

    if is_reconciled is not None:
        query = query.filter(CashFlowTransaction.is_reconciled == is_reconciled)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                CashFlowTransaction.description.ilike(search_filter),
                CashFlowTransaction.notes.ilike(search_filter)
            )
        )

    query = query.order_by(CashFlowTransaction.transaction_date.desc(), CashFlowTransaction.created_at.desc())
    transactions = query.offset(skip).limit(limit).all()

    return transactions


@router.get("/transactions/{transaction_id}", response_model=CashFlowTransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Buscar movimentação por ID

    Retorna detalhes de uma transação específica.
    """
    transaction = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.id == transaction_id,
            CashFlowTransaction.workspace_id == current_user.workspace_id
        )
    ).first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    return transaction


@router.patch("/transactions/{transaction_id}", response_model=CashFlowTransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: CashFlowTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualizar movimentação financeira

    Atualiza uma transação existente. Recalcula saldo se valor ou tipo mudarem.
    """
    db_transaction = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.id == transaction_id,
            CashFlowTransaction.workspace_id == current_user.workspace_id
        )
    ).first()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    # Guardar valores antigos para recalcular saldo
    old_value = db_transaction.value
    old_type = db_transaction.type
    old_account_id = db_transaction.account_id

    update_data = transaction_update.dict(exclude_unset=True)

    # Aplicar atualizações
    for field, value in update_data.items():
        setattr(db_transaction, field, value)

    db_transaction.updated_by = current_user.id
    db_transaction.updated_at = datetime.utcnow()

    # Recalcular saldo se necessário
    value_changed = 'value' in update_data and update_data['value'] != old_value
    type_changed = 'type' in update_data and update_data['type'] != old_type
    account_changed = 'account_id' in update_data and update_data['account_id'] != old_account_id

    if value_changed or type_changed or account_changed:
        # Reverter impacto da transação antiga
        if old_account_id:
            _update_account_balance(db, old_account_id, old_value, old_type, add=False)

        # Aplicar impacto da transação nova
        if db_transaction.account_id:
            _update_account_balance(db, db_transaction.account_id, db_transaction.value, db_transaction.type, add=True)

    db.commit()
    db.refresh(db_transaction)

    return db_transaction


@router.delete("/transactions/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletar movimentação financeira

    Remove uma transação e atualiza o saldo da conta automaticamente.
    """
    db_transaction = db.query(CashFlowTransaction).filter(
        and_(
            CashFlowTransaction.id == transaction_id,
            CashFlowTransaction.workspace_id == current_user.workspace_id
        )
    ).first()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with id {transaction_id} not found"
        )

    # Reverter impacto no saldo
    if db_transaction.account_id:
        _update_account_balance(
            db,
            db_transaction.account_id,
            db_transaction.value,
            db_transaction.type,
            add=False
        )

    db.delete(db_transaction)
    db.commit()

    return None


# ============================================
# TRANSFER ENDPOINT
# ============================================

@router.post("/transfer", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(
    transfer: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transferência entre contas

    Cria duas transações vinculadas: saída na conta de origem e entrada na conta de destino.
    """
    # Validar conta de origem
    from_account = db.query(BankAccount).filter(
        and_(
            BankAccount.id == transfer.from_account_id,
            BankAccount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not from_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source account with id {transfer.from_account_id} not found"
        )

    # Validar conta de destino
    to_account = db.query(BankAccount).filter(
        and_(
            BankAccount.id == transfer.to_account_id,
            BankAccount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not to_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination account with id {transfer.to_account_id} not found"
        )

    # Criar transação de saída
    exit_transaction = CashFlowTransaction(
        workspace_id=current_user.workspace_id,
        transaction_date=transfer.transaction_date,
        type=TransactionType.SAIDA.value,
        category="Transferência",
        description=f"Transfer to {to_account.bank_name}: {transfer.description}",
        value=transfer.value,
        account_id=transfer.from_account_id,
        reference_type="transfer",
        reference_id=transfer.to_account_id,
        notes=transfer.notes,
        created_by=current_user.id,
        updated_by=current_user.id
    )

    db.add(exit_transaction)
    db.flush()  # Para obter o ID

    # Criar transação de entrada
    entry_transaction = CashFlowTransaction(
        workspace_id=current_user.workspace_id,
        transaction_date=transfer.transaction_date,
        type=TransactionType.ENTRADA.value,
        category="Transferência",
        description=f"Transfer from {from_account.bank_name}: {transfer.description}",
        value=transfer.value,
        account_id=transfer.to_account_id,
        reference_type="transfer",
        reference_id=transfer.from_account_id,
        parent_transaction_id=exit_transaction.id,
        notes=transfer.notes,
        created_by=current_user.id,
        updated_by=current_user.id
    )

    db.add(entry_transaction)
    db.commit()

    # Atualizar saldos
    _update_account_balance(db, transfer.from_account_id, transfer.value, TransactionType.SAIDA.value, add=True)
    _update_account_balance(db, transfer.to_account_id, transfer.value, TransactionType.ENTRADA.value, add=True)

    db.refresh(exit_transaction)
    db.refresh(entry_transaction)

    return TransferResponse(
        from_transaction=exit_transaction,
        to_transaction=entry_transaction
    )


# ============================================
# HELPER FUNCTIONS
# ============================================

def _update_account_balance(db: Session, account_id: int, value: float, transaction_type: str, add: bool = True):
    """Atualiza o saldo de uma conta bancária"""
    account = db.query(BankAccount).filter(BankAccount.id == account_id).first()

    if not account:
        return

    # Calcular impacto no saldo
    impact = value if transaction_type == TransactionType.ENTRADA.value else -value

    if not add:
        impact = -impact

    account.current_balance += impact
    account.updated_at = datetime.utcnow()

    db.commit()
