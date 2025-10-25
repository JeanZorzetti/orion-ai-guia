from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Sale(Base):
    """
    Sale model - Vendas realizadas.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Sale details
    customer_name = Column(String, nullable=False)
    customer_document = Column(String, nullable=True)  # CPF/CNPJ
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)

    # Status and dates
    status = Column(String, default="pending", nullable=False)  # pending, completed, cancelled
    sale_date = Column(Date, default=datetime.utcnow, nullable=False)

    # Additional info
    notes = Column(Text, nullable=True)  # Campo para observações/notas

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="sales")
    product = relationship("Product", back_populates="sales")

    def __repr__(self):
        return f"<Sale(id={self.id}, customer='{self.customer_name}', workspace_id={self.workspace_id})>"
