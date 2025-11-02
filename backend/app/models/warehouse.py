"""
Modelos de Depósitos (Warehouses) para gestão de múltiplos locais de estoque

Fase: 2 - Sprint Backend Inventory
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.models import Base
import enum


class WarehouseType(str, enum.Enum):
    """Tipos de depósito"""
    PRINCIPAL = "principal"  # Depósito principal
    FILIAL = "filial"  # Filial
    TERCEIRIZADO = "terceirizado"  # Terceirizado
    CONSIGNADO = "consignado"  # Consignado


class AreaType(str, enum.Enum):
    """Tipos de área dentro do depósito"""
    RACKING = "racking"  # Área de estante/prateleira
    COLD_ROOM = "cold_room"  # Câmara fria
    BULK = "bulk"  # Área de granel
    EXPEDITION = "expedition"  # Área de expedição
    RECEPTION = "reception"  # Área de recepção
    QUARANTINE = "quarantine"  # Área de quarentena


class TransferStatus(str, enum.Enum):
    """Status de transferência entre depósitos"""
    PENDING = "pending"  # Pendente de aprovação
    APPROVED = "approved"  # Aprovada
    IN_TRANSIT = "in_transit"  # Em trânsito
    COMPLETED = "completed"  # Completa
    CANCELLED = "cancelled"  # Cancelada


class Warehouse(Base):
    """
    Modelo de Depósito/Armazém

    Representa um local físico de armazenamento de produtos.
    Suporta múltiplos depósitos por workspace.
    """
    __tablename__ = "warehouses"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações Básicas
    name = Column(String(255), nullable=False, index=True)  # Nome do depósito
    code = Column(String(50), nullable=False, index=True)  # Código único
    type = Column(SQLEnum(WarehouseType), nullable=False, default=WarehouseType.PRINCIPAL)

    # Endereço (armazenado como JSON para flexibilidade)
    address = Column(JSON, nullable=True)  # {street, number, complement, neighborhood, city, state, zip_code, country}

    # Status
    is_main = Column(Boolean, default=False, nullable=False)  # É o depósito principal?
    is_active = Column(Boolean, default=True, nullable=False)

    # Capacidade
    total_capacity = Column(Float, nullable=True)  # Capacidade total (m³, unidades, etc)
    current_occupation = Column(Float, default=0.0, nullable=False)  # Ocupação atual

    # Responsável
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    manager_name = Column(String(255), nullable=True)  # Cache do nome
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)

    # Localização GPS
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Notas
    notes = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    workspace = relationship("Workspace")
    manager = relationship("User", foreign_keys=[manager_id], backref="managed_warehouses")
    areas = relationship("WarehouseArea", back_populates="warehouse", cascade="all, delete-orphan")
    transfers_from = relationship("StockTransfer", foreign_keys="StockTransfer.from_warehouse_id", back_populates="from_warehouse")
    transfers_to = relationship("StockTransfer", foreign_keys="StockTransfer.to_warehouse_id", back_populates="to_warehouse")
    creator = relationship("User", foreign_keys=[created_by], backref="created_warehouses")
    updater = relationship("User", foreign_keys=[updated_by], backref="updated_warehouses")

    def __repr__(self):
        return f"<Warehouse(id={self.id}, name='{self.name}', code='{self.code}')>"


class WarehouseArea(Base):
    """
    Modelo de Área dentro de um Depósito

    Representa divisões dentro de um depósito (câmara fria, área de expedição, etc).
    """
    __tablename__ = "warehouse_areas"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Warehouse
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações da Área
    name = Column(String(255), nullable=False)
    type = Column(SQLEnum(AreaType), nullable=False)

    # Capacidade
    capacity = Column(Float, nullable=True)  # Capacidade da área
    current_occupation = Column(Float, default=0.0, nullable=False)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Controles especiais (câmaras frias, etc)
    requires_refrigeration = Column(Boolean, default=False)
    temperature_range = Column(JSON, nullable=True)  # {min: 2, max: 8} em Celsius

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    warehouse = relationship("Warehouse", back_populates="areas")

    def __repr__(self):
        return f"<WarehouseArea(id={self.id}, name='{self.name}', warehouse_id={self.warehouse_id})>"


class StockTransfer(Base):
    """
    Modelo de Transferência de Estoque entre Depósitos

    Representa uma transferência de produtos de um depósito para outro.
    """
    __tablename__ = "stock_transfers"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Transfer Number
    transfer_number = Column(String(100), nullable=False, unique=True, index=True)

    # Depósitos
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)

    # Produto
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    batch_id = Column(Integer, ForeignKey("product_batches.id", ondelete="SET NULL"), nullable=True)  # Lote opcional

    # Quantidade
    quantity = Column(Integer, nullable=False)

    # Status
    status = Column(SQLEnum(TransferStatus), nullable=False, default=TransferStatus.PENDING, index=True)

    # Datas
    requested_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_date = Column(DateTime, nullable=True)
    shipped_date = Column(DateTime, nullable=True)
    received_date = Column(DateTime, nullable=True)
    cancelled_date = Column(DateTime, nullable=True)

    # Usuários
    requested_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    shipped_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    received_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Notas
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id], back_populates="transfers_from")
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id], back_populates="transfers_to")
    product = relationship("Product")
    batch = relationship("ProductBatch")
    requester = relationship("User", foreign_keys=[requested_by], backref="requested_transfers")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_transfers")
    shipper = relationship("User", foreign_keys=[shipped_by], backref="shipped_transfers")
    receiver = relationship("User", foreign_keys=[received_by], backref="received_transfers")

    def __repr__(self):
        return f"<StockTransfer(id={self.id}, number='{self.transfer_number}', status='{self.status}')>"
