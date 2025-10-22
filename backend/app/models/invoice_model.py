from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Invoice(Base):
    """
    Invoice model - Notas Fiscais / Faturas.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)

    # Invoice details
    invoice_number = Column(String, nullable=False, index=True)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)

    # Financial details
    total_value = Column(Float, nullable=False, default=0.0)
    net_value = Column(Float, nullable=True)
    tax_value = Column(Float, nullable=True)

    # Category and status
    category = Column(String, nullable=True)  # Produtos, Serviços, etc.
    status = Column(String, default="pending", nullable=False)  # pending, validated, paid, cancelled

    # Additional info
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=True)  # Caminho do arquivo PDF/imagem

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")

    def __repr__(self):
        return f"<Invoice(id={self.id}, number='{self.invoice_number}', workspace_id={self.workspace_id})>"
