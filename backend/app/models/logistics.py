"""
Logistics Models
Picking, Packing, Shipping and Route Management
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from app.db.base_class import Base


# ============================================================================
# ENUMS
# ============================================================================

class PickingType(str, enum.Enum):
    SINGLE_ORDER = "single_order"
    BATCH = "batch"
    WAVE = "wave"


class PickingStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PackingStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    PROBLEM = "problem"


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    IN_ROUTE = "in_route"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETURNED = "returned"


class RouteStatus(str, enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class VehicleStatus(str, enum.Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"


class DeliveryPriority(str, enum.Enum):
    NORMAL = "normal"
    URGENT = "urgent"
    EXPRESS = "express"


# ============================================================================
# MODELS
# ============================================================================

class BoxType(Base):
    """Box/Package Types for Packing"""
    __tablename__ = "box_types"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)

    # Dimensions in cm
    internal_length = Column(Float, nullable=False)
    internal_width = Column(Float, nullable=False)
    internal_height = Column(Float, nullable=False)

    # Limits
    max_weight = Column(Float, nullable=False)  # kg

    # Cost
    cost = Column(Float, nullable=False)

    # Availability
    stock_quantity = Column(Integer, default=0, nullable=False)
    min_stock = Column(Integer, default=0, nullable=False)

    # Usage
    is_active = Column(Boolean, default=True, nullable=False)
    usage_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="box_types")

    __table_args__ = (
        Index('idx_box_type_workspace', 'workspace_id', 'code'),
    )


class PickingList(Base):
    """Picking Lists for Order Fulfillment"""
    __tablename__ = "picking_lists"

    id = Column(Integer, primary_key=True, index=True)
    picking_number = Column(String(100), nullable=False, unique=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    # Type
    type = Column(SQLEnum(PickingType), nullable=False)

    # Orders (JSON array of sale IDs)
    sale_ids = Column(JSON, nullable=False)

    # Items (JSON array with product details, locations, etc.)
    items = Column(JSON, nullable=False)

    # Optimized route (JSON array of locations)
    picking_route = Column(JSON, nullable=True)

    # Status
    status = Column(SQLEnum(PickingStatus), default=PickingStatus.PENDING, nullable=False, index=True)

    # Team
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Metrics
    estimated_time = Column(Integer, nullable=False)  # minutes
    actual_time = Column(Integer, nullable=True)  # minutes

    # Priority
    priority = Column(String(20), default='normal', nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="picking_lists")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    packing_jobs = relationship("PackingJob", back_populates="picking_list", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_picking_workspace_status', 'workspace_id', 'status'),
        Index('idx_picking_created', 'created_at'),
    )


class PackingStation(Base):
    """Packing Stations in Warehouse"""
    __tablename__ = "packing_stations"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)

    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=False)

    # Configuration
    packer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Metrics
    orders_packed_today = Column(Integer, default=0, nullable=False)
    avg_packing_time = Column(Float, default=0, nullable=False)  # minutes
    accuracy_rate = Column(Float, default=100, nullable=False)  # percentage

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="packing_stations")
    warehouse = relationship("Warehouse")
    packer = relationship("User", foreign_keys=[packer_id])
    packing_jobs = relationship("PackingJob", back_populates="station")

    __table_args__ = (
        Index('idx_packing_station_workspace', 'workspace_id', 'code'),
    )


class PackingJob(Base):
    """Packing Jobs for Orders"""
    __tablename__ = "packing_jobs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    picking_list_id = Column(Integer, ForeignKey("picking_lists.id"), nullable=True)
    station_id = Column(Integer, ForeignKey("packing_stations.id"), nullable=True)

    # Customer info (denormalized for performance)
    customer_name = Column(String(255), nullable=False)
    shipping_address = Column(JSON, nullable=False)

    # Packaging
    selected_box_id = Column(Integer, ForeignKey("box_types.id"), nullable=True)
    weight = Column(Float, nullable=False)  # kg
    dimensions = Column(JSON, nullable=False)  # length, width, height

    # Items (JSON array)
    items = Column(JSON, nullable=False)

    # Status
    status = Column(SQLEnum(PackingStatus), default=PackingStatus.PENDING, nullable=False, index=True)
    problem_description = Column(Text, nullable=True)

    # Labels and documents
    shipping_label_url = Column(Text, nullable=True)
    invoice_url = Column(Text, nullable=True)
    packing_slip_url = Column(Text, nullable=True)

    # Responsible
    packed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    packed_at = Column(DateTime, nullable=True)

    # Quality check
    quality_checked = Column(Boolean, default=False, nullable=False)
    quality_checked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    quality_checked_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="packing_jobs")
    sale = relationship("Sale")
    picking_list = relationship("PickingList", back_populates="packing_jobs")
    station = relationship("PackingStation", back_populates="packing_jobs")
    selected_box = relationship("BoxType")
    packer = relationship("User", foreign_keys=[packed_by])
    quality_checker = relationship("User", foreign_keys=[quality_checked_by])

    __table_args__ = (
        Index('idx_packing_job_workspace_status', 'workspace_id', 'status'),
        Index('idx_packing_job_sale', 'sale_id'),
    )


class Vehicle(Base):
    """Delivery Vehicles"""
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    license_plate = Column(String(20), nullable=False, unique=True, index=True)
    model = Column(String(100), nullable=False)
    brand = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)

    # Capacity
    max_weight = Column(Float, nullable=False)  # kg
    max_volume = Column(Float, nullable=False)  # m³

    # Status
    status = Column(SQLEnum(VehicleStatus), default=VehicleStatus.AVAILABLE, nullable=False, index=True)

    # Current location (JSON: latitude, longitude, updated_at)
    current_location = Column(JSON, nullable=True)

    # Costs
    fuel_consumption = Column(Float, nullable=True)  # km/l
    daily_cost = Column(Float, nullable=True)

    # Maintenance
    odometer_km = Column(Float, default=0, nullable=False)
    last_maintenance_at = Column(DateTime, nullable=True)
    next_maintenance_km = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="vehicles")
    delivery_routes = relationship("DeliveryRoute", back_populates="vehicle")

    __table_args__ = (
        Index('idx_vehicle_workspace_status', 'workspace_id', 'status'),
    )


class DeliveryRoute(Base):
    """Delivery Routes"""
    __tablename__ = "delivery_routes"

    id = Column(Integer, primary_key=True, index=True)
    route_number = Column(String(100), nullable=False, unique=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)

    # Vehicle
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False, index=True)

    # Driver
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Route data
    total_distance_km = Column(Float, default=0, nullable=False)
    estimated_duration = Column(Integer, default=0, nullable=False)  # minutes
    actual_duration = Column(Integer, nullable=True)  # minutes

    # Optimization
    optimized = Column(Boolean, default=False, nullable=False)
    optimization_savings = Column(Float, nullable=True)  # percentage

    # Status
    status = Column(SQLEnum(RouteStatus), default=RouteStatus.PLANNED, nullable=False, index=True)

    # Timing
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="delivery_routes")
    vehicle = relationship("Vehicle", back_populates="delivery_routes")
    driver = relationship("User", foreign_keys=[driver_id])
    deliveries = relationship("Delivery", back_populates="route", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_delivery_route_workspace_date', 'workspace_id', 'date'),
        Index('idx_delivery_route_status', 'status'),
    )


class Delivery(Base):
    """Individual Deliveries"""
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    route_id = Column(Integer, ForeignKey("delivery_routes.id"), nullable=True, index=True)

    # Sequence in route
    sequence_number = Column(Integer, nullable=True)

    # Customer info
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(50), nullable=True)

    # Address
    address = Column(JSON, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Delivery window
    delivery_window_start = Column(DateTime, nullable=True)
    delivery_window_end = Column(DateTime, nullable=True)

    # Priority
    priority = Column(SQLEnum(DeliveryPriority), default=DeliveryPriority.NORMAL, nullable=False)

    # Packages (JSON array)
    packages = Column(JSON, nullable=False)

    # Status
    status = Column(SQLEnum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False, index=True)

    # Delivery details
    delivered_at = Column(DateTime, nullable=True)
    delivered_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    proof_of_delivery_url = Column(Text, nullable=True)
    recipient_name = Column(String(255), nullable=True)
    recipient_document = Column(String(50), nullable=True)
    signature_url = Column(Text, nullable=True)

    # Failed delivery
    failed_at = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    reschedule_date = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="deliveries")
    sale = relationship("Sale")
    route = relationship("DeliveryRoute", back_populates="deliveries")
    customer = relationship("Customer")
    delivered_by_user = relationship("User", foreign_keys=[delivered_by])

    __table_args__ = (
        Index('idx_delivery_workspace_status', 'workspace_id', 'status'),
        Index('idx_delivery_route_sequence', 'route_id', 'sequence_number'),
        Index('idx_delivery_window', 'delivery_window_start'),
    )
