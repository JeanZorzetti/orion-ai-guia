from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

from app.core.database import Base

class Invoice(Base):
    """
    Modelo para faturas/contas a pagar
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Dados do fornecedor
    supplier_name = Column(String(255), nullable=False)
    supplier_cnpj = Column(String(20), nullable=True)
    supplier_address = Column(Text, nullable=True)
    supplier_contact = Column(String(255), nullable=True)

    # Dados da fatura
    invoice_number = Column(String(100), nullable=False)
    issue_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)

    # Valores
    total_amount = Column(Float, nullable=False)
    tax_amount = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)

    # Descrição e categorização
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    payment_method = Column(String(50), nullable=True)

    # Status da fatura
    status = Column(String(20), default="pending")  # pending, paid, overdue, cancelled

    # Items da fatura (JSON)
    items = Column(JSON, nullable=True)

    # Dados de IA
    confidence_score = Column(Float, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    processing_notes = Column(Text, nullable=True)

    # Anexos
    original_filename = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(50), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    # Relacionamentos
    user = relationship("User", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Invoice(id={self.id}, supplier={self.supplier_name}, number={self.invoice_number}, amount={self.total_amount})>"

    @property
    def is_overdue(self):
        """Verifica se a fatura está vencida"""
        if self.status == "paid":
            return False
        return self.due_date < datetime.utcnow()

    @property
    def days_until_due(self):
        """Calcula quantos dias faltam para o vencimento"""
        if self.status == "paid":
            return None
        delta = self.due_date - datetime.utcnow()
        return delta.days

    def to_dict(self):
        """Converte o modelo para dicionário"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "supplier_name": self.supplier_name,
            "supplier_cnpj": self.supplier_cnpj,
            "invoice_number": self.invoice_number,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "total_amount": float(self.total_amount) if self.total_amount else 0,
            "tax_amount": float(self.tax_amount) if self.tax_amount else 0,
            "net_amount": float(self.net_amount) if self.net_amount else 0,
            "description": self.description,
            "category": self.category,
            "payment_method": self.payment_method,
            "status": self.status,
            "items": self.items,
            "confidence_score": float(self.confidence_score) if self.confidence_score else None,
            "ai_suggestions": self.ai_suggestions,
            "is_overdue": self.is_overdue,
            "days_until_due": self.days_until_due,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None
        }