from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Enum as SQLEnum, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class InvoiceStatus(str, enum.Enum):
    """Status de uma fatura a pagar"""
    PENDING = "pending"  # Pendente de validação
    VALIDATED = "validated"  # Validada, aguardando pagamento
    APPROVED = "approved"  # Aprovada para pagamento
    PAID = "paid"  # Paga
    CANCELLED = "cancelled"  # Cancelada
    OVERDUE = "overdue"  # Vencida


class PaymentMethod(str, enum.Enum):
    """Métodos de pagamento"""
    BANK_TRANSFER = "bank_transfer"
    CHECK = "check"
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    BOLETO = "boleto"
    OTHER = "other"


class Supplier(Base):
    """Modelo de Fornecedor"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)

    # Dados básicos
    name = Column(String(255), nullable=False, index=True)
    legal_name = Column(String(255))
    cnpj = Column(String(18), index=True)
    cpf = Column(String(14), index=True)

    # Contato
    email = Column(String(255))
    phone = Column(String(20))
    mobile = Column(String(20))

    # Endereço
    address_street = Column(String(255))
    address_number = Column(String(20))
    address_complement = Column(String(100))
    address_neighborhood = Column(String(100))
    address_city = Column(String(100))
    address_state = Column(String(2))
    address_zipcode = Column(String(10))

    # Dados bancários
    bank_name = Column(String(100))
    bank_code = Column(String(10))
    agency = Column(String(20))
    account_number = Column(String(30))
    account_type = Column(String(20))  # corrente, poupança
    pix_key = Column(String(255))
    pix_key_type = Column(String(20))  # cpf, cnpj, email, phone, random

    # Configurações
    payment_term_days = Column(Integer, default=30)  # Prazo padrão de pagamento
    credit_limit = Column(Float, default=0)
    discount_percentage = Column(Float, default=0)  # Desconto padrão

    # Status
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    tags = Column(JSON)

    # Auditoria
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    workspace = relationship("Workspace", back_populates="suppliers")
    invoices = relationship("AccountsPayableInvoice", back_populates="supplier", cascade="all, delete-orphan")


class AccountsPayableInvoice(Base):
    """Modelo de Fatura a Pagar (Contas a Pagar)"""
    __tablename__ = "accounts_payable_invoices"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Identificação
    invoice_number = Column(String(100), nullable=False, index=True)  # Número da NF
    invoice_key = Column(String(44), index=True)  # Chave da NF-e

    # Datas
    invoice_date = Column(Date, nullable=False, index=True)  # Data de emissão
    due_date = Column(Date, nullable=False, index=True)  # Data de vencimento
    payment_date = Column(Date, index=True)  # Data de pagamento efetivo

    # Valores
    gross_value = Column(Float, nullable=False)  # Valor bruto
    discount_percentage = Column(Float, default=0)  # Desconto em %
    discount_value = Column(Float, default=0)  # Valor do desconto
    discount_available_until = Column(Date)  # Data limite para desconto
    additional_charges = Column(Float, default=0)  # Encargos adicionais
    total_value = Column(Float, nullable=False)  # Valor total
    paid_value = Column(Float, default=0)  # Valor pago

    # Pagamento
    payment_method = Column(SQLEnum(PaymentMethod))
    payment_reference = Column(String(255))  # Referência do pagamento (ex: número do cheque)
    bank_account_id = Column(Integer, ForeignKey("cash_flow_bank_accounts.id"))  # Conta bancária usada

    # Status
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING, index=True)

    # Categorização
    category = Column(String(100), index=True)
    subcategory = Column(String(100))
    cost_center = Column(String(100))
    project_code = Column(String(100))

    # Aprovação
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    approval_notes = Column(Text)

    # Recorrência
    is_recurring = Column(Boolean, default=False)
    recurrence_rule = Column(JSON)  # Regra de recorrência (mensal, anual, etc)
    parent_invoice_id = Column(Integer, ForeignKey("accounts_payable_invoices.id"))

    # Anexos e observações
    attachments = Column(JSON)  # Lista de URLs de arquivos anexos
    notes = Column(Text)
    tags = Column(JSON)

    # Integração
    reference_type = Column(String(50))  # Tipo de referência (purchase_order, expense, etc)
    reference_id = Column(Integer)  # ID da referência

    # Auditoria
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    workspace = relationship("Workspace")
    supplier = relationship("Supplier", back_populates="invoices")
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id])
    parent_invoice = relationship("AccountsPayableInvoice", remote_side=[id])
    installments = relationship("InvoiceInstallment", back_populates="invoice", cascade="all, delete-orphan")
    payment_history = relationship("PaymentHistory", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceInstallment(Base):
    """Modelo de Parcela de Fatura"""
    __tablename__ = "invoice_installments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("accounts_payable_invoices.id"), nullable=False)

    # Identificação
    installment_number = Column(Integer, nullable=False)  # Número da parcela
    total_installments = Column(Integer, nullable=False)  # Total de parcelas

    # Valores
    value = Column(Float, nullable=False)
    paid_value = Column(Float, default=0)

    # Datas
    due_date = Column(Date, nullable=False, index=True)
    payment_date = Column(Date)

    # Status
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.PENDING)

    # Auditoria
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamentos
    invoice = relationship("AccountsPayableInvoice", back_populates="installments")


class PaymentHistory(Base):
    """Histórico de Pagamentos"""
    __tablename__ = "payment_history"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("accounts_payable_invoices.id"), nullable=False)

    # Pagamento
    payment_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod))
    payment_reference = Column(String(255))

    # Banco
    bank_account_id = Column(Integer, ForeignKey("cash_flow_bank_accounts.id"))

    # Observações
    notes = Column(Text)

    # Auditoria
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    invoice = relationship("AccountsPayableInvoice", back_populates="payment_history")
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id])


class SupplierContact(Base):
    """Contatos do Fornecedor"""
    __tablename__ = "supplier_contacts"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Dados do contato
    name = Column(String(255), nullable=False)
    role = Column(String(100))  # Cargo
    email = Column(String(255))
    phone = Column(String(20))
    mobile = Column(String(20))

    # Configurações
    is_primary = Column(Boolean, default=False)
    receives_invoices = Column(Boolean, default=False)
    receives_statements = Column(Boolean, default=False)

    # Auditoria
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento
    supplier = relationship("Supplier")
