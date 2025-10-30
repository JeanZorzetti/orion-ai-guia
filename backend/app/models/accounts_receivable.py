from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Date, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AccountsReceivable(Base):
    """
    Accounts Receivable model - Contas a Receber.
    Representa valores a receber de clientes.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "accounts_receivable"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    # Document info
    document_number = Column(String(100), nullable=False, index=True)  # NF, Boleto, etc.

    # Customer info
    customer_id = Column(Integer, nullable=True, index=True)  # FK futura para tabela customers
    customer_name = Column(String(255), nullable=False)
    customer_document = Column(String(20), nullable=True)  # CPF/CNPJ
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=True)

    # Dates
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    payment_date = Column(Date, nullable=True)  # Data efetiva do pagamento

    # Financial values
    value = Column(Float, nullable=False)  # Valor total
    paid_value = Column(Float, default=0.0, nullable=False)  # Valor já pago
    discount_value = Column(Float, default=0.0, nullable=True)  # Desconto aplicado
    interest_value = Column(Float, default=0.0, nullable=True)  # Juros/multa
    net_value = Column(Float, nullable=True)  # Valor líquido final

    # Status and classification
    status = Column(
        String(50),
        nullable=False,
        default="pendente",
        index=True
    )  # pendente, parcial, recebido, vencido, cancelado, em_negociacao

    risk_category = Column(
        String(50),
        nullable=True,
        index=True
    )  # excelente, bom, regular, ruim, critico

    days_overdue = Column(Integer, default=0, nullable=False)  # Dias de atraso

    # Payment info
    payment_method = Column(String(50), nullable=True)  # boleto, pix, transferencia, cartao, dinheiro, cheque
    payment_account = Column(String(100), nullable=True)  # Conta bancária de recebimento

    # Description and notes
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)  # Notas internas (não visíveis ao cliente)

    # References
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)  # Referência a venda
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)  # Referência a NF-e

    # Additional data
    category = Column(String(100), nullable=True)  # Vendas, Serviços, Aluguéis, etc.
    subcategory = Column(String(100), nullable=True)
    tags = Column(JSON, nullable=True)  # Tags para filtros/busca

    # Installment info (for parcelamentos)
    is_installment = Column(Boolean, default=False)
    installment_number = Column(Integer, nullable=True)  # 1/12, 2/12, etc.
    total_installments = Column(Integer, nullable=True)
    parent_receivable_id = Column(Integer, nullable=True)  # ID da AR "mãe"

    # Communication tracking
    last_reminder_sent = Column(DateTime, nullable=True)  # Última cobrança enviada
    reminder_count = Column(Integer, default=0)  # Número de cobranças enviadas

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="accounts_receivable")
    sale = relationship("Sale", back_populates="receivables", foreign_keys=[sale_id])
    invoice = relationship("Invoice", foreign_keys=[invoice_id])

    def __repr__(self):
        return f"<AccountsReceivable(id={self.id}, doc='{self.document_number}', customer='{self.customer_name}', value={self.value}, status='{self.status}')>"

    @property
    def remaining_value(self) -> float:
        """Calcula o valor restante a receber"""
        return max(0, self.value - self.paid_value)

    @property
    def payment_percentage(self) -> float:
        """Calcula a porcentagem paga"""
        if self.value == 0:
            return 0.0
        return (self.paid_value / self.value) * 100

    @property
    def is_overdue(self) -> bool:
        """Verifica se está vencida"""
        if self.status in ['recebido', 'cancelado']:
            return False
        return datetime.now().date() > self.due_date

    @property
    def is_fully_paid(self) -> bool:
        """Verifica se foi totalmente paga"""
        return self.paid_value >= self.value
