"""
Analytics and Business Intelligence Models
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class KPICategory(str, Enum):
    SALES = "sales"
    INVENTORY = "inventory"
    CUSTOMERS = "customers"
    OPERATIONS = "operations"
    FINANCIAL = "financial"


class AggregationType(str, Enum):
    SUM = "sum"
    AVG = "avg"
    COUNT = "count"
    MIN = "min"
    MAX = "max"
    MEDIAN = "median"


class FormatType(str, Enum):
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    NUMBER = "number"
    DECIMAL = "decimal"


class KPIStatus(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertCategory(str, Enum):
    SALES = "sales"
    INVENTORY = "inventory"
    CUSTOMERS = "customers"
    OPERATIONS = "operations"


class ActionType(str, Enum):
    ORDER_STOCK = "order_stock"
    REDUCE_PRICE = "reduce_price"
    PROMOTE_PRODUCT = "promote_product"
    CONTACT_CUSTOMER = "contact_customer"
    REVIEW_COST = "review_cost"


class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class ReportType(str, Enum):
    SALES = "sales"
    INVENTORY = "inventory"
    CUSTOMERS = "customers"
    PRODUCTS = "products"
    FINANCIAL = "financial"


class VisualizationType(str, Enum):
    TABLE = "table"
    CHART = "chart"
    PIVOT = "pivot"
    KPI = "kpi"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    AREA = "area"
    SCATTER = "scatter"
    DOUGHNUT = "doughnut"


class ReportStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ExecutionType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"


# ============================================================================
# MODELS
# ============================================================================

class KPIDefinition(Base):
    """KPI Definitions for monitoring"""
    __tablename__ = "kpi_definitions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(KPICategory), nullable=False, index=True)

    # Calculation
    metric_field = Column(String(255), nullable=False)
    aggregation = Column(SQLEnum(AggregationType), nullable=False)
    filters = Column(JSON, nullable=True)  # ReportFilter[]

    # Display
    format = Column(SQLEnum(FormatType), nullable=False)
    prefix = Column(String(50), nullable=True)
    suffix = Column(String(50), nullable=True)

    # Targets
    target_value = Column(Float, nullable=True)
    warning_threshold = Column(Float, nullable=True)
    critical_threshold = Column(Float, nullable=True)

    # Comparison
    compare_to_previous_period = Column(Boolean, default=True, nullable=False)

    # Visibility
    show_on_dashboard = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="kpi_definitions")
    kpi_values = relationship("KPIValue", back_populates="kpi_definition", cascade="all, delete-orphan")


class KPIValue(Base):
    """Historical KPI Values"""
    __tablename__ = "kpi_values"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    kpi_definition_id = Column(Integer, ForeignKey("kpi_definitions.id"), nullable=False, index=True)

    # Period
    period_start = Column(DateTime(timezone=True), nullable=False, index=True)
    period_end = Column(DateTime(timezone=True), nullable=False, index=True)

    # Values
    current_value = Column(Float, nullable=False)
    previous_value = Column(Float, nullable=True)
    change_percentage = Column(Float, nullable=True)
    trend = Column(String(20), nullable=False)  # up, down, stable

    # Target
    target_value = Column(Float, nullable=True)
    target_achievement = Column(Float, nullable=True)  # percentage

    # Status
    status = Column(SQLEnum(KPIStatus), nullable=False)

    # Timestamp
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="kpi_values")
    kpi_definition = relationship("KPIDefinition", back_populates="kpi_values")


class DashboardAlert(Base):
    """Dashboard Alerts for anomalies and important events"""
    __tablename__ = "dashboard_alerts"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    type = Column(SQLEnum(AlertType), nullable=False, index=True)
    category = Column(SQLEnum(AlertCategory), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)

    action_required = Column(Boolean, default=False, nullable=False)
    action_label = Column(String(255), nullable=True)
    action_url = Column(String(500), nullable=True)

    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    is_dismissed = Column(Boolean, default=False, nullable=False, index=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="dashboard_alerts")


class RecommendedAction(Base):
    """AI-powered recommended actions"""
    __tablename__ = "recommended_actions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    type = Column(SQLEnum(ActionType), nullable=False, index=True)
    priority = Column(SQLEnum(PriorityLevel), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    potential_impact = Column(String(500), nullable=True)
    estimated_effort = Column(SQLEnum(PriorityLevel), nullable=False)

    # Related entity
    related_entity_id = Column(String(50), nullable=True, index=True)
    related_entity_type = Column(String(50), nullable=True)  # product, customer, order

    # Status
    is_completed = Column(Boolean, default=False, nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    is_dismissed = Column(Boolean, default=False, nullable=False, index=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="recommended_actions")


class CustomReport(Base):
    """Custom Report Definitions"""
    __tablename__ = "custom_reports"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(ReportType), nullable=False, index=True)

    # Dimensions and Metrics
    dimensions = Column(JSON, nullable=False)  # string[]
    metrics = Column(JSON, nullable=False)  # ReportMetric[]

    # Filters and Sorting
    filters = Column(JSON, nullable=True)  # ReportFilter[]
    sort_by = Column(String(100), nullable=True)
    sort_order = Column(String(10), nullable=True)  # asc, desc

    # Visualization
    visualization = Column(SQLEnum(VisualizationType), nullable=False)
    chart_type = Column(SQLEnum(ChartType), nullable=True)
    layout = Column(JSON, nullable=True)

    # Schedule
    schedule = Column(JSON, nullable=True)  # ReportSchedule

    # Sharing
    is_public = Column(Boolean, default=False, nullable=False)
    shared_with = Column(JSON, nullable=True)  # user IDs

    # Metadata
    created_by = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    run_count = Column(Integer, default=0, nullable=False)

    # Favorites
    is_favorite = Column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace", back_populates="custom_reports")
    executions = relationship("ReportExecution", back_populates="report", cascade="all, delete-orphan")


class ReportExecution(Base):
    """Report Execution History"""
    __tablename__ = "report_executions"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    report_id = Column(Integer, ForeignKey("custom_reports.id"), nullable=False, index=True)

    # Execution
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False, index=True)
    duration_seconds = Column(Integer, nullable=True)

    # Results
    row_count = Column(Integer, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)

    # Error
    error_message = Column(Text, nullable=True)

    # Metadata
    executed_by = Column(String(50), nullable=False)
    execution_type = Column(SQLEnum(ExecutionType), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="report_executions")
    report = relationship("CustomReport", back_populates="executions")
