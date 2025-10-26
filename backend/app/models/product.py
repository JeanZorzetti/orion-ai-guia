from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Product(Base):
    """
    Product model - Produtos do estoque.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "products"
    __table_args__ = (
        # SKU único por workspace (mas permite NULL/vazio)
        UniqueConstraint('workspace_id', 'sku', name='uq_workspace_sku'),
    )

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    # Product details
    name = Column(String, nullable=False, index=True)
    sku = Column(String, nullable=True, index=True)  # Removido unique=True
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True, index=True)

    # Pricing
    cost_price = Column(Float, nullable=True, default=0.0)
    sale_price = Column(Float, nullable=False, default=0.0)

    # Inventory
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock_level = Column(Integer, default=0, nullable=False)
    unit = Column(String, default="un", nullable=False)  # un, kg, l, etc.

    # Status
    active = Column(Boolean, default=True, nullable=False)

    # Dados Fiscais do Produto
    ncm_code = Column(String(8), nullable=True)  # Nomenclatura Comum do Mercosul - OBRIGATÓRIO para NF-e
    cest_code = Column(String(7), nullable=True)  # Código Especificador da Substituição Tributária
    origin = Column(Integer, nullable=True, default=0)  # 0=Nacional, 1=Estrangeira-Importação Direta, etc.

    # ICMS (Simples Nacional - CSOSN ou Regime Normal - CST)
    icms_csosn = Column(String(4), nullable=True)  # Ex: '102', '400' (Simples Nacional)
    icms_cst = Column(String(3), nullable=True)    # Ex: '00', '20', '60' (Regime Normal)
    icms_aliquota = Column(Numeric(5, 2), nullable=True, default=0.00)

    # PIS/COFINS
    pis_cst = Column(String(2), nullable=True, default='99')
    pis_aliquota = Column(Numeric(5, 2), nullable=True, default=0.00)
    cofins_cst = Column(String(2), nullable=True, default='99')
    cofins_aliquota = Column(Numeric(5, 2), nullable=True, default=0.00)

    # IPI (se aplicável)
    ipi_cst = Column(String(2), nullable=True)
    ipi_aliquota = Column(Numeric(5, 2), nullable=True, default=0.00)

    # Informações Adicionais Fiscais
    fiscal_description = Column(Text, nullable=True)  # Descrição fiscal (pode ser diferente do nome comercial)
    unidade_tributavel = Column(String(10), default='UN')  # UN, KG, MT, L, etc.

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="products")
    sales = relationship("Sale", back_populates="product", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}', workspace_id={self.workspace_id})>"
