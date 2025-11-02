"""
Inventory Cycle Count Models
Physical inventory counting and reconciliation
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from enum import Enum

from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class InventoryStatus(str, Enum):
    """Status of inventory cycle count"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CountItemStatus(str, Enum):
    """Status of individual count item"""
    PENDING = "pending"
    COUNTED = "counted"
    VERIFIED = "verified"
    DISCREPANCY = "discrepancy"


# ============================================================================
# MODELS
# ============================================================================

class InventoryCycleCount(Base):
    """
    Inventory Cycle Count - Contagem cíclica de estoque
    Represents a physical inventory count session
    """
    __tablename__ = "inventory_cycle_counts"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    # Identification
    code = Column(String(50), nullable=False, index=True)  # INV-2024-001
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Tracking
    status = Column(SQLEnum(InventoryStatus), nullable=False, default=InventoryStatus.PENDING, index=True)

    # Responsible user
    responsible_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Dates
    scheduled_date = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Statistics
    total_items = Column(Integer, default=0)
    items_counted = Column(Integer, default=0)
    items_with_discrepancy = Column(Integer, default=0)

    # Audit
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Notes
    notes = Column(Text, nullable=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="inventory_cycle_counts")
    responsible_user = relationship("User", foreign_keys=[responsible_user_id])
    count_items = relationship("InventoryCountItem", back_populates="cycle_count", cascade="all, delete-orphan")


class InventoryCountItem(Base):
    """
    Inventory Count Item - Item individual da contagem
    Represents a single product being counted in an inventory cycle
    """
    __tablename__ = "inventory_count_items"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    cycle_count_id = Column(Integer, ForeignKey("inventory_cycle_counts.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Quantities
    expected_quantity = Column(Integer, nullable=False)  # System quantity before count
    counted_quantity = Column(Integer, nullable=True)     # Physical count
    final_quantity = Column(Integer, nullable=True)       # After reconciliation
    discrepancy = Column(Integer, nullable=True)          # Difference

    # Status
    status = Column(SQLEnum(CountItemStatus), nullable=False, default=CountItemStatus.PENDING, index=True)

    # Counting details
    counted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    counted_at = Column(DateTime, nullable=True)

    # Verification (second count if needed)
    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_quantity = Column(Integer, nullable=True)

    # Notes and reasons
    notes = Column(Text, nullable=True)
    discrepancy_reason = Column(Text, nullable=True)

    # Adjustment (if discrepancy found)
    adjustment_applied = Column(Boolean, default=False)
    stock_adjustment_id = Column(Integer, ForeignKey("stock_adjustments.id"), nullable=True)

    # Audit
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workspace = relationship("Workspace")
    cycle_count = relationship("InventoryCycleCount", back_populates="count_items")
    product = relationship("Product")
    counted_by = relationship("User", foreign_keys=[counted_by_user_id])
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])
    stock_adjustment = relationship("StockAdjustment")
