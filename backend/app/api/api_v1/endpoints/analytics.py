"""
Analytics and Business Intelligence Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, case
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.analytics import (
    KPIDefinition, KPIValue, DashboardAlert,
    RecommendedAction, CustomReport, ReportExecution
)
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.models.accounts_receivable import AccountsReceivable


router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class DateRangeSchema(BaseModel):
    start: datetime
    end: datetime


class ChannelMetricsSchema(BaseModel):
    channel: str
    channel_name: str
    sales: float
    sales_count: int
    percentage: float
    avg_ticket: float
    growth: float
    trend: str


class CategoryMetricsSchema(BaseModel):
    category_id: str
    category: str
    sales: float
    quantity: int
    percentage: float
    margin: float
    growth: float


class ProductPerformanceSchema(BaseModel):
    product_id: str
    product_name: str
    sku: str
    quantity_sold: int
    revenue: float
    profit: float
    margin_percentage: float
    growth: float
    rank: int
    abc_class: str


class SalesFunnelSchema(BaseModel):
    leads: int
    opportunities: int
    quotes: int
    won: int
    lost: int
    conversion_rate: float
    avg_deal_size: float
    avg_sales_cycle_days: float
    lead_to_opportunity: float
    opportunity_to_quote: float
    quote_to_won: float


class GoalsTrackingSchema(BaseModel):
    period: DateRangeSchema
    revenue_goal: float
    revenue_actual: float
    revenue_achievement_percentage: float
    revenue_remaining: float
    revenue_projection: float
    units_goal: Optional[int] = None
    units_actual: Optional[int] = None
    units_achievement_percentage: Optional[float] = None
    on_track: bool
    days_remaining: int
    daily_target_remaining: float


class TimeSeriesDataSchema(BaseModel):
    date: datetime
    sales: float
    sales_count: int
    avg_ticket: float


class SalesDashboardMetricsSchema(BaseModel):
    period: DateRangeSchema
    workspace_id: int
    total_sales: float
    sales_count: int
    avg_ticket: float
    vs_previous_period: dict
    vs_same_period_last_year: dict
    by_channel: List[ChannelMetricsSchema]
    by_category: List[CategoryMetricsSchema]
    top_products: List[ProductPerformanceSchema]
    funnel: SalesFunnelSchema
    goals: GoalsTrackingSchema
    time_series: List[TimeSeriesDataSchema]


class ABCDistributionSchema(BaseModel):
    abc_class: str
    products_count: int
    revenue_contribution: float
    stock_value: float
    stock_percentage: float
    avg_turnover: float


class InventoryHealthMetricsSchema(BaseModel):
    period: DateRangeSchema
    workspace_id: int
    total_inventory_value: float
    avg_inventory_value: float
    inventory_cost: float
    inventory_turnover: float
    days_of_inventory: float
    inventory_turnover_rate: float
    abc_distribution: List[ABCDistributionSchema]
    out_of_stock_items: int
    low_stock_items: int
    overstock_items: int
    slow_moving_items: int
    obsolete_items: int
    dead_stock_items: int
    items_expiring_30_days: int
    items_expiring_60_days: int
    items_expiring_90_days: int
    items_expired: int
    expiration_loss_value: float
    inventory_accuracy: float
    last_cycle_count_date: Optional[datetime] = None
    health_score: float
    health_status: str


class CustomerSegmentMetricsSchema(BaseModel):
    segment: str
    customer_count: int
    percentage: float
    total_revenue: float
    avg_revenue: float
    avg_orders: float
    retention_rate: float


class TopCustomerSchema(BaseModel):
    customer_id: str
    customer_name: str
    total_spent: float
    total_orders: int
    avg_order_value: float
    lifetime_value: float
    last_purchase_date: datetime
    customer_score: float
    segment: str


class CustomerAnalyticsSchema(BaseModel):
    period: DateRangeSchema
    total_customers: int
    new_customers: int
    active_customers: int
    churned_customers: int
    total_customer_value: float
    avg_customer_value: float
    avg_customer_lifetime_value: float
    retention_rate: float
    churn_rate: float
    repeat_purchase_rate: float
    by_segment: List[CustomerSegmentMetricsSchema]
    top_customers: List[TopCustomerSchema]


class KPIValueSchema(BaseModel):
    kpi_id: str
    kpi_name: str
    current_value: float
    previous_value: Optional[float] = None
    change_percentage: Optional[float] = None
    trend: str
    target_value: Optional[float] = None
    target_achievement: Optional[float] = None
    status: str
    calculated_at: datetime
    period: DateRangeSchema


class DashboardAlertSchema(BaseModel):
    id: str
    type: str
    category: str
    title: str
    message: str
    value: Optional[float] = None
    threshold: Optional[float] = None
    action_required: bool
    action_label: Optional[str] = None
    action_url: Optional[str] = None
    created_at: datetime


class RecommendedActionSchema(BaseModel):
    id: str
    type: str
    priority: str
    title: str
    description: str
    potential_impact: Optional[str] = None
    estimated_effort: str
    related_entity_id: Optional[str] = None
    related_entity_type: Optional[str] = None


class ExecutiveDashboardSchema(BaseModel):
    workspace_id: int
    period: DateRangeSchema
    kpis: List[KPIValueSchema]
    sales_metrics: SalesDashboardMetricsSchema
    inventory_metrics: InventoryHealthMetricsSchema
    customer_metrics: CustomerAnalyticsSchema
    alerts: List[DashboardAlertSchema]
    recommended_actions: List[RecommendedActionSchema]
    generated_at: datetime


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/executive-dashboard", response_model=ExecutiveDashboardSchema)
def get_executive_dashboard(
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get executive dashboard with all metrics"""

    # Default to last 30 days
    if not period_start:
        period_start = datetime.now() - timedelta(days=30)
    if not period_end:
        period_end = datetime.now()

    period = DateRangeSchema(start=period_start, end=period_end)

    # Get sales metrics
    sales_metrics = _get_sales_metrics(db, current_user.workspace_id, period_start, period_end)

    # Get inventory metrics
    inventory_metrics = _get_inventory_metrics(db, current_user.workspace_id, period_start, period_end)

    # Get customer metrics
    customer_metrics = _get_customer_metrics(db, current_user.workspace_id, period_start, period_end)

    # Get KPIs
    kpis = _get_kpis(db, current_user.workspace_id, period_start, period_end)

    # Get alerts
    alerts = db.query(DashboardAlert).filter(
        and_(
            DashboardAlert.workspace_id == current_user.workspace_id,
            DashboardAlert.is_dismissed == False
        )
    ).order_by(desc(DashboardAlert.created_at)).limit(10).all()

    # Get recommended actions
    actions = db.query(RecommendedAction).filter(
        and_(
            RecommendedAction.workspace_id == current_user.workspace_id,
            RecommendedAction.is_completed == False,
            RecommendedAction.is_dismissed == False
        )
    ).order_by(
        case(
            (RecommendedAction.priority == 'high', 1),
            (RecommendedAction.priority == 'medium', 2),
            else_=3
        ),
        desc(RecommendedAction.created_at)
    ).limit(5).all()

    return {
        "workspace_id": current_user.workspace_id,
        "period": period,
        "kpis": [_convert_kpi_to_schema(kpi, period) for kpi in kpis],
        "sales_metrics": sales_metrics,
        "inventory_metrics": inventory_metrics,
        "customer_metrics": customer_metrics,
        "alerts": [_convert_alert_to_schema(alert) for alert in alerts],
        "recommended_actions": [_convert_action_to_schema(action) for action in actions],
        "generated_at": datetime.now()
    }


@router.get("/sales-metrics", response_model=SalesDashboardMetricsSchema)
def get_sales_metrics(
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed sales metrics"""

    if not period_start:
        period_start = datetime.now() - timedelta(days=30)
    if not period_end:
        period_end = datetime.now()

    return _get_sales_metrics(db, current_user.workspace_id, period_start, period_end)


@router.get("/inventory-metrics", response_model=InventoryHealthMetricsSchema)
def get_inventory_metrics(
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed inventory health metrics"""

    if not period_start:
        period_start = datetime.now() - timedelta(days=30)
    if not period_end:
        period_end = datetime.now()

    return _get_inventory_metrics(db, current_user.workspace_id, period_start, period_end)


@router.get("/customer-metrics", response_model=CustomerAnalyticsSchema)
def get_customer_metrics(
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed customer analytics"""

    if not period_start:
        period_start = datetime.now() - timedelta(days=30)
    if not period_end:
        period_end = datetime.now()

    return _get_customer_metrics(db, current_user.workspace_id, period_start, period_end)


@router.get("/kpis", response_model=List[KPIValueSchema])
def get_kpis(
    period_start: Optional[datetime] = Query(None),
    period_end: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all KPIs for the workspace"""

    if not period_start:
        period_start = datetime.now() - timedelta(days=30)
    if not period_end:
        period_end = datetime.now()

    period = DateRangeSchema(start=period_start, end=period_end)
    kpis = _get_kpis(db, current_user.workspace_id, period_start, period_end)

    return [_convert_kpi_to_schema(kpi, period) for kpi in kpis]


@router.get("/alerts", response_model=List[DashboardAlertSchema])
def list_alerts(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all dashboard alerts"""

    query = db.query(DashboardAlert).filter(
        and_(
            DashboardAlert.workspace_id == current_user.workspace_id,
            DashboardAlert.is_dismissed == False
        )
    )

    if unread_only:
        query = query.filter(DashboardAlert.is_read == False)

    alerts = query.order_by(desc(DashboardAlert.created_at)).all()

    return [_convert_alert_to_schema(alert) for alert in alerts]


@router.put("/alerts/{alert_id}/read")
def mark_alert_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark alert as read"""

    alert = db.query(DashboardAlert).filter(
        and_(
            DashboardAlert.id == alert_id,
            DashboardAlert.workspace_id == current_user.workspace_id
        )
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    db.commit()

    return {"success": True}


@router.put("/alerts/{alert_id}/dismiss")
def dismiss_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss alert"""

    alert = db.query(DashboardAlert).filter(
        and_(
            DashboardAlert.id == alert_id,
            DashboardAlert.workspace_id == current_user.workspace_id
        )
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_dismissed = True
    alert.dismissed_at = datetime.now()
    db.commit()

    return {"success": True}


@router.get("/recommended-actions", response_model=List[RecommendedActionSchema])
def list_recommended_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all recommended actions"""

    actions = db.query(RecommendedAction).filter(
        and_(
            RecommendedAction.workspace_id == current_user.workspace_id,
            RecommendedAction.is_completed == False,
            RecommendedAction.is_dismissed == False
        )
    ).order_by(
        case(
            (RecommendedAction.priority == 'high', 1),
            (RecommendedAction.priority == 'medium', 2),
            else_=3
        ),
        desc(RecommendedAction.created_at)
    ).all()

    return [_convert_action_to_schema(action) for action in actions]


@router.put("/recommended-actions/{action_id}/complete")
def complete_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark action as completed"""

    action = db.query(RecommendedAction).filter(
        and_(
            RecommendedAction.id == action_id,
            RecommendedAction.workspace_id == current_user.workspace_id
        )
    ).first()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.is_completed = True
    action.completed_at = datetime.now()
    db.commit()

    return {"success": True}


@router.put("/recommended-actions/{action_id}/dismiss")
def dismiss_action(
    action_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss action"""

    action = db.query(RecommendedAction).filter(
        and_(
            RecommendedAction.id == action_id,
            RecommendedAction.workspace_id == current_user.workspace_id
        )
    ).first()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.is_dismissed = True
    action.dismissed_at = datetime.now()
    db.commit()

    return {"success": True}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _get_sales_metrics(db: Session, workspace_id: int, period_start: datetime, period_end: datetime) -> SalesDashboardMetricsSchema:
    """Calculate sales metrics for a period"""

    # Current period sales
    sales = db.query(Sale).filter(
        and_(
            Sale.workspace_id == workspace_id,
            Sale.sale_date >= period_start,
            Sale.sale_date <= period_end
        )
    ).all()

    total_sales = sum(s.total for s in sales)
    sales_count = len(sales)
    avg_ticket = total_sales / sales_count if sales_count > 0 else 0

    # Previous period for comparison
    period_days = (period_end - period_start).days
    prev_period_start = period_start - timedelta(days=period_days)
    prev_period_end = period_start

    prev_sales = db.query(Sale).filter(
        and_(
            Sale.workspace_id == workspace_id,
            Sale.sale_date >= prev_period_start,
            Sale.sale_date < prev_period_end
        )
    ).all()

    prev_total_sales = sum(s.total for s in prev_sales)
    prev_sales_count = len(prev_sales)
    prev_avg_ticket = prev_total_sales / prev_sales_count if prev_sales_count > 0 else 0

    # Calculate changes
    total_sales_change = ((total_sales - prev_total_sales) / prev_total_sales * 100) if prev_total_sales > 0 else 0
    sales_count_change = ((sales_count - prev_sales_count) / prev_sales_count * 100) if prev_sales_count > 0 else 0
    avg_ticket_change = ((avg_ticket - prev_avg_ticket) / prev_avg_ticket * 100) if prev_avg_ticket > 0 else 0

    trend = 'up' if total_sales_change > 0 else 'down' if total_sales_change < 0 else 'stable'

    # Top products
    product_sales = {}
    for sale in sales:
        # Simplified - in real implementation would aggregate from sale items
        pass

    return SalesDashboardMetricsSchema(
        period=DateRangeSchema(start=period_start, end=period_end),
        workspace_id=workspace_id,
        total_sales=total_sales,
        sales_count=sales_count,
        avg_ticket=avg_ticket,
        vs_previous_period={
            "total_sales_change": total_sales_change,
            "sales_count_change": sales_count_change,
            "avg_ticket_change": avg_ticket_change,
            "trend": trend
        },
        vs_same_period_last_year={
            "total_sales_change": 0,
            "sales_count_change": 0,
            "trend": "stable"
        },
        by_channel=[],
        by_category=[],
        top_products=[],
        funnel=SalesFunnelSchema(
            leads=0, opportunities=0, quotes=0, won=sales_count, lost=0,
            conversion_rate=0, avg_deal_size=avg_ticket, avg_sales_cycle_days=0,
            lead_to_opportunity=0, opportunity_to_quote=0, quote_to_won=0
        ),
        goals=GoalsTrackingSchema(
            period=DateRangeSchema(start=period_start, end=period_end),
            revenue_goal=0, revenue_actual=total_sales, revenue_achievement_percentage=0,
            revenue_remaining=0, revenue_projection=total_sales,
            on_track=True, days_remaining=0, daily_target_remaining=0
        ),
        time_series=[]
    )


def _get_inventory_metrics(db: Session, workspace_id: int, period_start: datetime, period_end: datetime) -> InventoryHealthMetricsSchema:
    """Calculate inventory health metrics"""

    products = db.query(Product).filter(
        Product.workspace_id == workspace_id
    ).all()

    total_inventory_value = sum(p.cost_price * p.quantity_in_stock for p in products)
    avg_inventory_value = total_inventory_value / len(products) if products else 0
    out_of_stock = sum(1 for p in products if p.quantity_in_stock == 0)
    low_stock = sum(1 for p in products if 0 < p.quantity_in_stock <= p.min_stock)

    return InventoryHealthMetricsSchema(
        period=DateRangeSchema(start=period_start, end=period_end),
        workspace_id=workspace_id,
        total_inventory_value=total_inventory_value,
        avg_inventory_value=avg_inventory_value,
        inventory_cost=total_inventory_value,
        inventory_turnover=0,
        days_of_inventory=0,
        inventory_turnover_rate=0,
        abc_distribution=[],
        out_of_stock_items=out_of_stock,
        low_stock_items=low_stock,
        overstock_items=0,
        slow_moving_items=0,
        obsolete_items=0,
        dead_stock_items=0,
        items_expiring_30_days=0,
        items_expiring_60_days=0,
        items_expiring_90_days=0,
        items_expired=0,
        expiration_loss_value=0,
        inventory_accuracy=95.0,
        health_score=75.0,
        health_status="good"
    )


def _get_customer_metrics(db: Session, workspace_id: int, period_start: datetime, period_end: datetime) -> CustomerAnalyticsSchema:
    """Calculate customer analytics"""

    customers = db.query(Customer).filter(
        Customer.workspace_id == workspace_id
    ).all()

    total_customers = len(customers)

    # New customers in period
    new_customers = db.query(Customer).filter(
        and_(
            Customer.workspace_id == workspace_id,
            Customer.created_at >= period_start,
            Customer.created_at <= period_end
        )
    ).count()

    return CustomerAnalyticsSchema(
        period=DateRangeSchema(start=period_start, end=period_end),
        total_customers=total_customers,
        new_customers=new_customers,
        active_customers=total_customers,
        churned_customers=0,
        total_customer_value=0,
        avg_customer_value=0,
        avg_customer_lifetime_value=0,
        retention_rate=0,
        churn_rate=0,
        repeat_purchase_rate=0,
        by_segment=[],
        top_customers=[]
    )


def _get_kpis(db: Session, workspace_id: int, period_start: datetime, period_end: datetime):
    """Get KPI definitions for workspace"""

    kpis = db.query(KPIDefinition).filter(
        and_(
            KPIDefinition.workspace_id == workspace_id,
            KPIDefinition.show_on_dashboard == True
        )
    ).order_by(KPIDefinition.display_order).all()

    return kpis


def _convert_kpi_to_schema(kpi: KPIDefinition, period: DateRangeSchema) -> KPIValueSchema:
    """Convert KPI definition to schema with calculated value"""

    return KPIValueSchema(
        kpi_id=str(kpi.id),
        kpi_name=kpi.name,
        current_value=0,
        trend="stable",
        status="good",
        calculated_at=datetime.now(),
        period=period
    )


def _convert_alert_to_schema(alert: DashboardAlert) -> DashboardAlertSchema:
    """Convert alert model to schema"""

    return DashboardAlertSchema(
        id=str(alert.id),
        type=alert.type.value,
        category=alert.category.value,
        title=alert.title,
        message=alert.message,
        value=alert.value,
        threshold=alert.threshold,
        action_required=alert.action_required,
        action_label=alert.action_label,
        action_url=alert.action_url,
        created_at=alert.created_at
    )


def _convert_action_to_schema(action: RecommendedAction) -> RecommendedActionSchema:
    """Convert action model to schema"""

    return RecommendedActionSchema(
        id=str(action.id),
        type=action.type.value,
        priority=action.priority.value,
        title=action.title,
        description=action.description,
        potential_impact=action.potential_impact,
        estimated_effort=action.estimated_effort.value,
        related_entity_id=action.related_entity_id,
        related_entity_type=action.related_entity_type
    )
