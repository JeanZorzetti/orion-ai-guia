"""
Marketplace Integration Models
Multi-tenant marketplace integration for omnichannel management
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


# ============================================================================
# ENUMS
# ============================================================================

class MarketplaceType(str, enum.Enum):
    MERCADO_LIVRE = "mercado_livre"
    AMAZON = "amazon"
    SHOPEE = "shopee"
    MAGALU = "magalu"
    B2W = "b2w"
    TIKTOK_SHOP = "tiktok_shop"
    SHOPIFY = "shopify"
    WOOCOMMERCE = "woocommerce"
    CUSTOM = "custom"


class SyncStatus(str, enum.Enum):
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"
    PENDING = "pending"


class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    OUT_OF_STOCK = "out_of_stock"
    ERROR = "error"


class UnifiedOrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class SyncJobStatus(str, enum.Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SyncJobType(str, enum.Enum):
    FULL_SYNC = "full_sync"
    INCREMENTAL = "incremental"
    STOCK_ONLY = "stock_only"
    ORDERS_ONLY = "orders_only"


class ConflictType(str, enum.Enum):
    STOCK_DISCREPANCY = "stock_discrepancy"
    PRICE_MISMATCH = "price_mismatch"
    DATA_CONFLICT = "data_conflict"


class ConflictSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# ============================================================================
# MODELS
# ============================================================================

class MarketplaceIntegration(Base):
    """
    Marketplace Integration
    Stores configuration for each marketplace connection
    """
    __tablename__ = "marketplace_integrations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    marketplace = Column(SQLEnum(MarketplaceType), nullable=False, index=True)
    name = Column(String(255), nullable=False)

    # Credentials (stored encrypted in production)
    credentials = Column(JSON, nullable=False)  # client_id, client_secret, access_token, etc.

    # Configuration
    is_active = Column(Boolean, default=True, nullable=False)
    auto_sync = Column(Boolean, default=True, nullable=False)
    sync_frequency = Column(Integer, default=30, nullable=False)  # minutes

    # Mapping
    default_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    price_adjustment_type = Column(String(50), nullable=True)  # 'percentage' or 'fixed'
    price_adjustment_value = Column(Float, default=0, nullable=False)

    # Sync settings
    sync_products = Column(Boolean, default=True, nullable=False)
    sync_orders = Column(Boolean, default=True, nullable=False)
    sync_stock = Column(Boolean, default=True, nullable=False)

    # Last sync
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_status = Column(SQLEnum(SyncStatus), default=SyncStatus.PENDING, nullable=False)
    last_sync_error = Column(Text, nullable=True)
    last_sync_summary = Column(JSON, nullable=True)  # products_synced, orders_imported, etc.

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="marketplace_integrations")
    warehouse = relationship("Warehouse", foreign_keys=[default_warehouse_id])
    listings = relationship("ProductListing", back_populates="integration", cascade="all, delete-orphan")
    orders = relationship("UnifiedOrder", back_populates="integration", cascade="all, delete-orphan")
    sync_jobs = relationship("SyncJob", back_populates="integration", cascade="all, delete-orphan")
    conflicts = relationship("SyncConflict", back_populates="integration", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_marketplace_workspace', 'workspace_id', 'marketplace'),
        Index('idx_marketplace_active', 'is_active'),
    )


class ProductListing(Base):
    """
    Product Listing on Marketplace
    Maps internal products to marketplace listings
    """
    __tablename__ = "product_listings"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    marketplace_integration_id = Column(Integer, ForeignKey("marketplace_integrations.id"), nullable=False, index=True)

    # External IDs
    external_id = Column(String(255), nullable=False, index=True)
    external_sku = Column(String(255), nullable=True)
    listing_url = Column(Text, nullable=True)

    # Price and stock
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=True)
    stock_quantity = Column(Integer, default=0, nullable=False)

    # Status
    status = Column(SQLEnum(ListingStatus), default=ListingStatus.ACTIVE, nullable=False, index=True)
    is_synced = Column(Boolean, default=False, nullable=False)
    sync_enabled = Column(Boolean, default=True, nullable=False)

    # Customization
    title = Column(String(500), nullable=True)  # Custom title
    description = Column(Text, nullable=True)  # Custom description
    images = Column(JSON, nullable=True)  # Array of image URLs
    category = Column(String(255), nullable=True)
    tags = Column(JSON, nullable=True)  # Array of tags

    # Metrics
    views = Column(Integer, default=0, nullable=False)
    sales = Column(Integer, default=0, nullable=False)
    conversion_rate = Column(Float, default=0, nullable=False)
    revenue = Column(Float, default=0, nullable=False)

    # Shipping
    free_shipping = Column(Boolean, default=False, nullable=False)
    shipping_cost = Column(Float, nullable=True)

    # Sync
    last_synced_at = Column(DateTime, nullable=True)
    sync_errors = Column(JSON, nullable=True)  # Array of error messages
    pending_changes = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="marketplace_listings")
    integration = relationship("MarketplaceIntegration", back_populates="listings")

    # Indexes
    __table_args__ = (
        Index('idx_listing_marketplace', 'marketplace_integration_id', 'status'),
        Index('idx_listing_product', 'product_id'),
        Index('idx_listing_external', 'external_id'),
    )


class UnifiedOrder(Base):
    """
    Unified Order from Marketplace
    Normalizes orders from different marketplaces
    """
    __tablename__ = "unified_orders"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    marketplace_integration_id = Column(Integer, ForeignKey("marketplace_integrations.id"), nullable=False, index=True)

    # External IDs
    external_order_id = Column(String(255), nullable=False, index=True)
    external_order_number = Column(String(255), nullable=False)

    # Customer data (normalized, stored as JSON)
    customer_data = Column(JSON, nullable=False)  # name, email, phone, document, etc.

    # Items (stored as JSON array)
    items = Column(JSON, nullable=False)

    # Shipping
    shipping_data = Column(JSON, nullable=False)  # method, cost, address, tracking, etc.

    # Payment
    payment_data = Column(JSON, nullable=False)  # method, status, paid_at, transaction_id

    # Totals
    subtotal = Column(Float, nullable=False)
    shipping_cost = Column(Float, default=0, nullable=False)
    discount = Column(Float, default=0, nullable=False)
    tax = Column(Float, default=0, nullable=False)
    total = Column(Float, nullable=False)

    # Unified status
    status = Column(SQLEnum(UnifiedOrderStatus), default=UnifiedOrderStatus.PENDING, nullable=False, index=True)

    # Internal mapping
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True, index=True)
    processed = Column(Boolean, default=False, nullable=False)
    processing_errors = Column(JSON, nullable=True)

    # Import
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    imported_by = Column(String(255), nullable=True)

    # Dates
    order_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="unified_orders")
    integration = relationship("MarketplaceIntegration", back_populates="orders")
    sale = relationship("Sale", foreign_keys=[sale_id])

    # Indexes
    __table_args__ = (
        Index('idx_unified_order_marketplace', 'marketplace_integration_id', 'status'),
        Index('idx_unified_order_external', 'external_order_id'),
        Index('idx_unified_order_date', 'order_date'),
        Index('idx_unified_order_processed', 'processed'),
    )


class SyncJob(Base):
    """
    Sync Job
    Tracks synchronization jobs with marketplaces
    """
    __tablename__ = "sync_jobs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    marketplace_integration_id = Column(Integer, ForeignKey("marketplace_integrations.id"), nullable=False, index=True)

    type = Column(SQLEnum(SyncJobType), nullable=False)
    status = Column(SQLEnum(SyncJobStatus), default=SyncJobStatus.RUNNING, nullable=False, index=True)

    # Progress
    total_items = Column(Integer, default=0, nullable=False)
    processed_items = Column(Integer, default=0, nullable=False)
    successful_items = Column(Integer, default=0, nullable=False)
    failed_items = Column(Integer, default=0, nullable=False)
    progress_percentage = Column(Float, default=0, nullable=False)

    # Result summary
    result = Column(JSON, nullable=True)  # products_created, products_updated, etc.

    # Timing
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    # Retry
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)

    # Error log
    error_log = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="sync_jobs")
    integration = relationship("MarketplaceIntegration", back_populates="sync_jobs")

    # Indexes
    __table_args__ = (
        Index('idx_sync_job_marketplace', 'marketplace_integration_id', 'status'),
        Index('idx_sync_job_created', 'created_at'),
    )


class SyncConflict(Base):
    """
    Sync Conflict
    Tracks conflicts between system and marketplace data
    """
    __tablename__ = "sync_conflicts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(ConflictType), nullable=False, index=True)

    # Product reference
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("product_listings.id"), nullable=True, index=True)
    marketplace_integration_id = Column(Integer, ForeignKey("marketplace_integrations.id"), nullable=False, index=True)

    # Conflict details
    field_name = Column(String(100), nullable=False)
    system_value = Column(String(500), nullable=False)
    marketplace_value = Column(String(500), nullable=False)

    # Resolution
    resolution_strategy = Column(String(50), default='manual', nullable=False)  # manual, system_wins, marketplace_wins
    resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(255), nullable=True)

    # Severity
    severity = Column(SQLEnum(ConflictSeverity), default=ConflictSeverity.MEDIUM, nullable=False)
    auto_resolvable = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    product = relationship("Product")
    listing = relationship("ProductListing")
    integration = relationship("MarketplaceIntegration", back_populates="conflicts")

    # Indexes
    __table_args__ = (
        Index('idx_conflict_marketplace', 'marketplace_integration_id', 'resolved'),
        Index('idx_conflict_product', 'product_id'),
        Index('idx_conflict_severity', 'severity', 'resolved'),
    )
