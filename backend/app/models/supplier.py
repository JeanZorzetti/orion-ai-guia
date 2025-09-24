from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class Supplier(Base):
    """
    Modelo para fornecedores
    """
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)

    # Dados básicos
    name = Column(String(255), nullable=False, index=True)
    cnpj = Column(String(18), unique=True, index=True, nullable=True)  # Formatado: XX.XXX.XXX/XXXX-XX

    # Dados de contato
    email = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    website = Column(String(255), nullable=True)

    # Endereço
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)  # UF
    postal_code = Column(String(10), nullable=True)  # CEP

    # Classificação e categoria
    category = Column(String(100), nullable=True)  # Categoria do fornecedor
    is_active = Column(Boolean, default=True, nullable=False)

    # Informações adicionais
    notes = Column(Text, nullable=True)

    # Metadados
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relacionamentos
    invoices = relationship("Invoice", back_populates="supplier")

    def __repr__(self):
        return f"<Supplier(id={self.id}, name='{self.name}', cnpj='{self.cnpj}')>"

    def to_dict(self):
        """Converte modelo para dicionário"""
        return {
            "id": self.id,
            "name": self.name,
            "cnpj": self.cnpj,
            "email": self.email,
            "phone": self.phone,
            "website": self.website,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "postal_code": self.postal_code,
            "category": self.category,
            "is_active": self.is_active,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    def to_summary(self):
        """Retorna resumo do fornecedor para uso em listas"""
        return {
            "id": self.id,
            "name": self.name,
            "cnpj": self.cnpj,
            "category": self.category,
            "is_active": self.is_active
        }

    @property
    def display_name(self):
        """Nome para exibição com CNPJ se disponível"""
        if self.cnpj:
            return f"{self.name} ({self.cnpj})"
        return self.name

    @classmethod
    def search_fields(cls):
        """Campos usados para busca fuzzy"""
        return ['name', 'cnpj']