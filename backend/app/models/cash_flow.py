"""
Modelos de Fluxo de Caixa para o Orion ERP

Este módulo contém os modelos de dados para gerenciamento de movimentações
financeiras e contas bancárias.

Fase: 2.1 - Sprint Backend Cash Flow
Referência: roadmaps/ROADMAP_FINANCEIRO_INTEGRACAO.md
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, JSON, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models import Base
import enum


class TransactionType(str, enum.Enum):
    """Tipos de transação financeira"""
    ENTRADA = "entrada"
    SAIDA = "saida"


class PaymentMethodType(str, enum.Enum):
    """Métodos de pagamento"""
    DINHEIRO = "dinheiro"
    PIX = "pix"
    BOLETO = "boleto"
    TRANSFERENCIA = "transferencia"
    CARTAO_CREDITO = "cartao_credito"
    CARTAO_DEBITO = "cartao_debito"
    CHEQUE = "cheque"
    OUTRO = "outro"


class ReferenceType(str, enum.Enum):
    """Tipos de referência de documentos"""
    INVOICE = "invoice"
    SALE = "sale"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    RECEIVABLE = "receivable"
    PAYABLE = "payable"
    OTHER = "other"


class AccountType(str, enum.Enum):
    """Tipos de conta bancária"""
    CORRENTE = "corrente"
    POUPANCA = "poupanca"
    INVESTIMENTO = "investimento"
    CAIXA = "caixa"


class BankAccount(Base):
    """
    Modelo de Conta Bancária

    Representa uma conta bancária ou caixa da empresa para controle
    de movimentações financeiras.
    """
    __tablename__ = "bank_accounts"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações da Conta
    bank_name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False, default=AccountType.CORRENTE.value)
    account_number = Column(String(50))
    agency = Column(String(20))

    # Saldo e Status
    current_balance = Column(Float, nullable=False, default=0.0)
    initial_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Detalhes Adicionais
    description = Column(Text)
    notes = Column(Text)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    workspace = relationship("Workspace", back_populates="bank_accounts")
    transactions = relationship("CashFlowTransaction", back_populates="account", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by], backref="created_bank_accounts")
    updater = relationship("User", foreign_keys=[updated_by], backref="updated_bank_accounts")

    # Constraints
    __table_args__ = (
        CheckConstraint('current_balance >= 0 OR account_type = \'caixa\'', name='check_positive_balance'),
    )

    def __repr__(self):
        return f"<BankAccount(id={self.id}, bank={self.bank_name}, balance={self.current_balance})>"


class CashFlowTransaction(Base):
    """
    Modelo de Movimentação Financeira (Cash Flow)

    Registra todas as entradas e saídas de caixa da empresa, incluindo
    pagamentos, recebimentos, transferências e outras movimentações.
    """
    __tablename__ = "cash_flow_transactions"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações da Transação
    transaction_date = Column(DateTime, nullable=False, index=True)
    type = Column(String(20), nullable=False, index=True)  # entrada ou saida
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100))
    description = Column(Text, nullable=False)

    # Valor
    value = Column(Float, nullable=False)

    # Pagamento
    payment_method = Column(String(50))
    account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="SET NULL"))

    # Referências a Documentos
    reference_type = Column(String(50))  # invoice, sale, expense, transfer, receivable, payable, other
    reference_id = Column(Integer)  # ID do documento de referência

    # Dados Adicionais
    tags = Column(JSON)  # Tags para categorização flexível
    notes = Column(Text)

    # Recorrência
    is_recurring = Column(Boolean, default=False, nullable=False)
    recurrence_rule = Column(JSON)  # Regra de recorrência (ex: {"frequency": "monthly", "interval": 1, "end_date": "2024-12-31"})
    parent_transaction_id = Column(Integer, ForeignKey("cash_flow_transactions.id", ondelete="SET NULL"))  # Para transações recorrentes

    # Reconciliação
    is_reconciled = Column(Boolean, default=False, nullable=False)
    reconciled_at = Column(DateTime)
    reconciled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    workspace = relationship("Workspace", back_populates="cash_flow_transactions")
    account = relationship("BankAccount", back_populates="transactions")
    parent_transaction = relationship("CashFlowTransaction", remote_side=[id], backref="recurring_transactions")
    creator = relationship("User", foreign_keys=[created_by], backref="created_transactions")
    updater = relationship("User", foreign_keys=[updated_by], backref="updated_transactions")
    reconciler = relationship("User", foreign_keys=[reconciled_by], backref="reconciled_transactions")

    # Constraints
    __table_args__ = (
        CheckConstraint('value > 0', name='check_positive_value'),
        CheckConstraint("type IN ('entrada', 'saida')", name='check_transaction_type'),
    )

    @property
    def net_value(self) -> float:
        """Valor líquido considerando tipo (entrada positiva, saída negativa)"""
        return self.value if self.type == TransactionType.ENTRADA.value else -self.value

    def __repr__(self):
        return f"<CashFlowTransaction(id={self.id}, date={self.transaction_date}, type={self.type}, value={self.value})>"
