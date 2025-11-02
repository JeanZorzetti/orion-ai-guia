"""
Modelo de Cliente (Customer)

Cliente para vendas e relacionamento
Fase: 2 - Sprint Backend Sales
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models import Base


class Customer(Base):
    """
    Modelo de Cliente

    Representa um cliente ou prospect.
    """
    __tablename__ = "customers"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações Básicas
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)

    # Empresa
    company_name = Column(String(255), nullable=True)
    company_document = Column(String(50), nullable=True)  # CNPJ/CPF

    # Endereço (JSON para flexibilidade)
    address = Column(JSON, nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Campos Customizados
    custom_fields = Column(JSON, nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")

    def __repr__(self):
        return f"<Customer(id={self.id}, name='{self.name}')>"
