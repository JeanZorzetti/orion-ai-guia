"""
Modelos de Lotes (Batches) para controle de validades e rastreabilidade

Fase: 2 - Sprint Backend Inventory
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models import Base
import enum


class BatchStatus(str, enum.Enum):
    """Status de um lote"""
    ACTIVE = "active"  # Ativo
    QUARANTINE = "quarantine"  # Em quarentena
    EXPIRED = "expired"  # Vencido
    RECALLED = "recalled"  # Recolhido


class MovementType(str, enum.Enum):
    """Tipos de movimentação de lote"""
    ENTRY = "entry"  # Entrada
    EXIT = "exit"  # Saída
    TRANSFER = "transfer"  # Transferência
    ADJUSTMENT = "adjustment"  # Ajuste


class ProductBatch(Base):
    """
    Modelo de Lote de Produto

    Representa um lote específico de produto com controle de validade,
    rastreabilidade e localização.
    """
    __tablename__ = "product_batches"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Produto
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações do Lote
    batch_number = Column(String(100), nullable=False, index=True)  # Número do lote
    manufacturing_date = Column(Date, nullable=False)  # Data de fabricação
    expiry_date = Column(Date, nullable=False, index=True)  # Data de validade

    # Quantidade e Custo
    quantity = Column(Integer, nullable=False, default=0)  # Quantidade atual no lote
    cost_price = Column(Float, nullable=False, default=0.0)  # Custo unitário do lote

    # Fornecedor e Origem
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    origin = Column(String(255), nullable=True)  # Origem (NF, PO, etc)

    # Localização
    warehouse_id = Column(Integer, nullable=True)  # ID do depósito (FK futura)
    location = Column(String(255), nullable=True)  # Localização específica (corredor, prateleira, etc)

    # Status
    status = Column(SQLEnum(BatchStatus), nullable=False, default=BatchStatus.ACTIVE, index=True)

    # Qualidade e Certificações
    quality_certificate = Column(String(255), nullable=True)  # Número do certificado de qualidade
    notes = Column(Text, nullable=True)  # Observações adicionais

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    workspace = relationship("Workspace", back_populates="product_batches")
    product = relationship("Product")
    supplier = relationship("Supplier")
    movements = relationship("BatchMovement", back_populates="batch", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by], backref="created_batches")
    updater = relationship("User", foreign_keys=[updated_by], backref="updated_batches")

    def __repr__(self):
        return f"<ProductBatch(id={self.id}, batch_number='{self.batch_number}', product_id={self.product_id})>"


class BatchMovement(Base):
    """
    Modelo de Movimentação de Lote

    Registra todas as movimentações de um lote: entradas, saídas,
    transferências e ajustes.
    """
    __tablename__ = "batch_movements"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Lote
    batch_id = Column(Integer, ForeignKey("product_batches.id", ondelete="CASCADE"), nullable=False, index=True)

    # Tipo de Movimentação
    type = Column(SQLEnum(MovementType), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Quantidade movimentada

    # Depósitos (para transferências)
    from_warehouse_id = Column(Integer, nullable=True)  # Depósito origem
    to_warehouse_id = Column(Integer, nullable=True)  # Depósito destino

    # Referências
    reference = Column(String(255), nullable=True)  # Referência (NF, Venda, etc)
    notes = Column(Text, nullable=True)  # Observações

    # Usuário responsável
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    workspace = relationship("Workspace")
    batch = relationship("ProductBatch", back_populates="movements")
    user = relationship("User", backref="batch_movements")

    def __repr__(self):
        return f"<BatchMovement(id={self.id}, type='{self.type}', batch_id={self.batch_id}, quantity={self.quantity})>"
