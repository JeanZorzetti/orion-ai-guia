from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Workspace(Base):
    """
    Workspace model - Central para multi-tenancy.
    Cada workspace representa uma empresa/organização isolada.
    """
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Dados Fiscais da Empresa
    cnpj = Column(String(14), nullable=True)
    razao_social = Column(String(255), nullable=True)
    nome_fantasia = Column(String(255), nullable=True)
    inscricao_estadual = Column(String(20), nullable=True)
    inscricao_municipal = Column(String(20), nullable=True)
    regime_tributario = Column(Integer, nullable=True)  # 1=Simples Nacional, 2=SN-Excesso, 3=Normal

    # Endereço Fiscal
    fiscal_cep = Column(String(8), nullable=True)
    fiscal_logradouro = Column(String(255), nullable=True)
    fiscal_numero = Column(String(20), nullable=True)
    fiscal_complemento = Column(String(100), nullable=True)
    fiscal_bairro = Column(String(100), nullable=True)
    fiscal_cidade = Column(String(100), nullable=True)
    fiscal_uf = Column(String(2), nullable=True)
    fiscal_codigo_municipio = Column(String(7), nullable=True)

    # Credenciais API Fiscal (criptografadas)
    fiscal_partner = Column(String(50), nullable=True)  # 'plugnotas', 'focusnfe', etc.
    fiscal_partner_api_key = Column(String(500), nullable=True)  # ENCRYPTED
    fiscal_partner_webhook_token = Column(String(100), nullable=True)

    # Certificado Digital (A1 - armazenado no parceiro)
    certificate_uploaded_at = Column(DateTime, nullable=True)
    certificate_expires_at = Column(DateTime, nullable=True)
    certificate_status = Column(String(20), default='not_uploaded')  # 'active', 'expired', 'not_uploaded'

    # Configurações de Notas
    nfe_serie = Column(Integer, default=1)
    nfe_next_number = Column(Integer, default=1)
    nfe_ambiente = Column(Integer, default=2)  # 1=Produção, 2=Homologação

    # Metadata de Configuração Fiscal
    fiscal_config_updated_at = Column(DateTime, nullable=True)
    fiscal_config_updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Integração Shopify
    integration_shopify_store_url = Column(String(255), nullable=True)
    integration_shopify_api_key = Column(String(500), nullable=True)  # ENCRYPTED
    integration_shopify_last_sync = Column(DateTime, nullable=True)

    # Relationships
    users = relationship("User", back_populates="workspace", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="workspace", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="workspace", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="workspace", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="workspace", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workspace(id={self.id}, name='{self.name}', slug='{self.slug}')>"
