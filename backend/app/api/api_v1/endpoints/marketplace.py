"""
Marketplace Endpoints
Omnichannel marketplace integration and management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.marketplace import (
    MarketplaceIntegration,
    ProductListing,
    UnifiedOrder,
    SyncJob,
    SyncConflict,
    MarketplaceType,
    ListingStatus,
    UnifiedOrderStatus,
    SyncJobStatus,
)
from app.models.product import Product
from pydantic import BaseModel


# ============================================================================
# SCHEMAS
# ============================================================================

class MarketplaceIntegrationResponse(BaseModel):
    id: int
    workspace_id: int
    marketplace: str
    name: str
    is_active: bool
    auto_sync: bool
    sync_frequency: int
    last_sync_at: Optional[datetime]
    last_sync_status: str
    last_sync_summary: Optional[dict]
    total_listings: int
    active_listings: int
    total_orders: int
    total_revenue: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListingResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    marketplace_integration_id: int
    marketplace: str
    external_id: str
    external_sku: Optional[str]
    listing_url: Optional[str]
    price: float
    original_price: Optional[float]
    stock_quantity: int
    status: str
    views: int
    sales: int
    conversion_rate: float
    revenue: float
    free_shipping: bool
    last_synced_at: Optional[datetime]
    pending_changes: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UnifiedOrderResponse(BaseModel):
    id: int
    workspace_id: int
    marketplace_integration_id: int
    marketplace: str
    marketplace_name: str
    external_order_id: str
    external_order_number: str
    customer: dict
    items: list
    shipping: dict
    payment: dict
    subtotal: float
    shipping_cost: float
    discount: float
    tax: float
    total: float
    status: str
    processed: bool
    sale_id: Optional[int]
    order_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncJobResponse(BaseModel):
    id: int
    workspace_id: int
    marketplace_integration_id: int
    marketplace: str
    type: str
    status: str
    total_items: int
    processed_items: int
    successful_items: int
    failed_items: int
    progress_percentage: float
    result: Optional[dict]
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncConflictResponse(BaseModel):
    id: int
    type: str
    product_id: int
    product_name: str
    listing_id: Optional[int]
    marketplace_integration_id: int
    marketplace: str
    field_name: str
    system_value: str
    marketplace_value: str
    resolution_strategy: str
    resolved: bool
    resolved_at: Optional[datetime]
    severity: str
    auto_resolvable: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MarketplaceDashboardResponse(BaseModel):
    overview: dict
    recent_orders: List[dict]
    recent_syncs: List[dict]
    pending_conflicts: int
    alerts: List[dict]
    stats: dict


class MarketplacePerformanceResponse(BaseModel):
    marketplace_integration_id: int
    marketplace: str
    total_orders: int
    total_revenue: float
    avg_order_value: float
    active_listings: int
    total_listings: int
    conversion_rate: float
    orders_growth: float
    revenue_growth: float


# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter()


# ============================================================================
# INTEGRATIONS
# ============================================================================

@router.get("/integrations", response_model=List[MarketplaceIntegrationResponse])
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all marketplace integrations for workspace"""
    integrations = db.query(MarketplaceIntegration).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    ).all()

    # Calculate statistics for each integration
    result = []
    for integration in integrations:
        total_listings = db.query(func.count(ProductListing.id)).filter(
            ProductListing.marketplace_integration_id == integration.id
        ).scalar() or 0

        active_listings = db.query(func.count(ProductListing.id)).filter(
            and_(
                ProductListing.marketplace_integration_id == integration.id,
                ProductListing.status == ListingStatus.ACTIVE
            )
        ).scalar() or 0

        total_orders = db.query(func.count(UnifiedOrder.id)).filter(
            UnifiedOrder.marketplace_integration_id == integration.id
        ).scalar() or 0

        total_revenue = db.query(func.sum(UnifiedOrder.total)).filter(
            UnifiedOrder.marketplace_integration_id == integration.id
        ).scalar() or 0.0

        result.append({
            **integration.__dict__,
            'total_listings': total_listings,
            'active_listings': active_listings,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
        })

    return result


@router.post("/integrations/{integration_id}/sync")
def sync_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger synchronization for a marketplace integration"""
    integration = db.query(MarketplaceIntegration).filter(
        and_(
            MarketplaceIntegration.id == integration_id,
            MarketplaceIntegration.workspace_id == current_user.workspace_id
        )
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if not integration.is_active:
        raise HTTPException(status_code=400, detail="Integration is not active")

    # Create sync job
    sync_job = SyncJob(
        workspace_id=current_user.workspace_id,
        marketplace_integration_id=integration_id,
        type='full_sync',
        status=SyncJobStatus.RUNNING,
        total_items=0,
        processed_items=0,
        successful_items=0,
        failed_items=0,
        progress_percentage=0,
        result={
            'products_created': 0,
            'products_updated': 0,
            'listings_created': 0,
            'listings_updated': 0,
            'orders_imported': 0,
            'stock_synced': 0,
            'errors': [],
        },
    )

    db.add(sync_job)
    db.commit()
    db.refresh(sync_job)

    # TODO: Trigger async sync task
    # In production, this would trigger a Celery task or similar

    return {"message": "Sync job created", "job_id": sync_job.id}


@router.put("/integrations/{integration_id}/toggle")
def toggle_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle integration active status"""
    integration = db.query(MarketplaceIntegration).filter(
        and_(
            MarketplaceIntegration.id == integration_id,
            MarketplaceIntegration.workspace_id == current_user.workspace_id
        )
    ).first()

    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration.is_active = not integration.is_active
    db.commit()
    db.refresh(integration)

    return integration


# ============================================================================
# LISTINGS
# ============================================================================

@router.get("/listings", response_model=List[ProductListingResponse])
def list_listings(
    marketplace_integration_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List product listings"""
    query = db.query(
        ProductListing,
        Product.name.label('product_name'),
        Product.sku.label('product_sku')
    ).join(
        Product, ProductListing.product_id == Product.id
    ).join(
        MarketplaceIntegration,
        ProductListing.marketplace_integration_id == MarketplaceIntegration.id
    ).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    )

    if marketplace_integration_id:
        query = query.filter(
            ProductListing.marketplace_integration_id == marketplace_integration_id
        )

    if status:
        query = query.filter(ProductListing.status == status)

    results = query.all()

    return [
        {
            **listing.__dict__,
            'product_name': product_name,
            'product_sku': product_sku,
        }
        for listing, product_name, product_sku in results
    ]


@router.put("/listings/{listing_id}/pause")
def pause_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Pause a listing"""
    listing = db.query(ProductListing).join(
        MarketplaceIntegration
    ).filter(
        and_(
            ProductListing.id == listing_id,
            MarketplaceIntegration.workspace_id == current_user.workspace_id
        )
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = ListingStatus.PAUSED
    listing.pending_changes = True
    db.commit()
    db.refresh(listing)

    return listing


@router.put("/listings/{listing_id}/activate")
def activate_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Activate a listing"""
    listing = db.query(ProductListing).join(
        MarketplaceIntegration
    ).filter(
        and_(
            ProductListing.id == listing_id,
            MarketplaceIntegration.workspace_id == current_user.workspace_id
        )
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.status = ListingStatus.ACTIVE
    listing.pending_changes = True
    db.commit()
    db.refresh(listing)

    return listing


# ============================================================================
# ORDERS
# ============================================================================

@router.get("/orders", response_model=List[UnifiedOrderResponse])
def list_orders(
    marketplace_integration_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List unified orders from marketplaces"""
    query = db.query(UnifiedOrder).join(
        MarketplaceIntegration
    ).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    )

    if marketplace_integration_id:
        query = query.filter(
            UnifiedOrder.marketplace_integration_id == marketplace_integration_id
        )

    if status:
        query = query.filter(UnifiedOrder.status == status)

    orders = query.order_by(UnifiedOrder.order_date.desc()).limit(limit).all()

    return [
        {
            **order.__dict__,
            'marketplace_name': order.integration.name,
            'customer': order.customer_data,
            'shipping': order.shipping_data,
            'payment': order.payment_data,
        }
        for order in orders
    ]


@router.put("/orders/{order_id}/process")
def process_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process a marketplace order"""
    order = db.query(UnifiedOrder).join(
        MarketplaceIntegration
    ).filter(
        and_(
            UnifiedOrder.id == order_id,
            MarketplaceIntegration.workspace_id == current_user.workspace_id
        )
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = UnifiedOrderStatus.PROCESSING
    order.processed = True
    db.commit()
    db.refresh(order)

    # TODO: Create internal sale from order
    # This would create a Sale record and link it to the order

    return order


# ============================================================================
# SYNC JOBS
# ============================================================================

@router.get("/sync-jobs", response_model=List[SyncJobResponse])
def list_sync_jobs(
    marketplace_integration_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sync jobs"""
    query = db.query(SyncJob).filter(
        SyncJob.workspace_id == current_user.workspace_id
    )

    if marketplace_integration_id:
        query = query.filter(
            SyncJob.marketplace_integration_id == marketplace_integration_id
        )

    if status:
        query = query.filter(SyncJob.status == status)

    jobs = query.order_by(SyncJob.created_at.desc()).limit(limit).all()

    return jobs


# ============================================================================
# CONFLICTS
# ============================================================================

@router.get("/conflicts", response_model=List[SyncConflictResponse])
def list_conflicts(
    resolved: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sync conflicts"""
    query = db.query(
        SyncConflict,
        Product.name.label('product_name')
    ).join(
        Product, SyncConflict.product_id == Product.id
    ).join(
        MarketplaceIntegration,
        SyncConflict.marketplace_integration_id == MarketplaceIntegration.id
    ).filter(
        Product.workspace_id == current_user.workspace_id
    )

    if resolved is not None:
        query = query.filter(SyncConflict.resolved == resolved)

    results = query.all()

    return [
        {
            **conflict.__dict__,
            'product_name': product_name,
        }
        for conflict, product_name in results
    ]


@router.put("/conflicts/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: int,
    strategy: str = Query(..., regex="^(system_wins|marketplace_wins)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resolve a sync conflict"""
    conflict = db.query(SyncConflict).join(
        Product
    ).filter(
        and_(
            SyncConflict.id == conflict_id,
            Product.workspace_id == current_user.workspace_id
        )
    ).first()

    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conflict.resolved = True
    conflict.resolved_at = datetime.utcnow()
    conflict.resolution_strategy = strategy
    conflict.resolved_by = current_user.email

    db.commit()
    db.refresh(conflict)

    # TODO: Apply resolution strategy
    # If system_wins, update marketplace
    # If marketplace_wins, update system

    return conflict


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

@router.get("/dashboard", response_model=MarketplaceDashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get marketplace dashboard data"""
    today = datetime.now().date()
    period_start = datetime.now() - timedelta(days=30)

    # Get integrations
    integrations = db.query(MarketplaceIntegration).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    ).all()

    active_integrations = [i for i in integrations if i.is_active]

    # Get total listings
    total_listings = db.query(func.count(ProductListing.id)).join(
        MarketplaceIntegration
    ).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    ).scalar() or 0

    active_listings = db.query(func.count(ProductListing.id)).join(
        MarketplaceIntegration
    ).filter(
        and_(
            MarketplaceIntegration.workspace_id == current_user.workspace_id,
            ProductListing.status == ListingStatus.ACTIVE
        )
    ).scalar() or 0

    # Get orders
    all_orders = db.query(UnifiedOrder).join(
        MarketplaceIntegration
    ).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    ).all()

    total_orders = len(all_orders)
    total_revenue = sum(o.total for o in all_orders)

    orders_today = [o for o in all_orders if o.order_date.date() == today]
    revenue_today = sum(o.total for o in orders_today)

    # Recent orders
    recent_orders = db.query(UnifiedOrder).join(
        MarketplaceIntegration
    ).filter(
        MarketplaceIntegration.workspace_id == current_user.workspace_id
    ).order_by(UnifiedOrder.order_date.desc()).limit(5).all()

    # Recent syncs
    recent_syncs = db.query(SyncJob).filter(
        SyncJob.workspace_id == current_user.workspace_id
    ).order_by(SyncJob.created_at.desc()).limit(5).all()

    # Unresolved conflicts
    pending_conflicts = db.query(func.count(SyncConflict.id)).join(
        Product
    ).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            SyncConflict.resolved == False
        )
    ).scalar() or 0

    return {
        "overview": {
            "total_integrations": len(integrations),
            "active_integrations": len(active_integrations),
            "total_listings": total_listings,
            "active_listings": active_listings,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
        },
        "recent_orders": [
            {
                "id": o.id,
                "external_order_number": o.external_order_number,
                "marketplace_name": o.integration.name,
                "marketplace": o.integration.marketplace.value,
                "customer": o.customer_data,
                "items": o.items,
                "total": o.total,
                "status": o.status.value,
            }
            for o in recent_orders
        ],
        "recent_syncs": [
            {
                "id": j.id,
                "marketplace": j.integration.marketplace.value,
                "type": j.type.value,
                "status": j.status.value,
                "progress_percentage": j.progress_percentage,
                "total_items": j.total_items,
                "processed_items": j.processed_items,
                "started_at": j.started_at,
            }
            for j in recent_syncs
        ],
        "pending_conflicts": pending_conflicts,
        "alerts": [],
        "stats": {
            "orders_today": len(orders_today),
            "revenue_today": revenue_today,
            "sync_errors_today": 0,
            "avg_sync_time": 120,
        },
    }


@router.get("/performance", response_model=List[MarketplacePerformanceResponse])
def get_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get performance metrics by marketplace"""
    integrations = db.query(MarketplaceIntegration).filter(
        and_(
            MarketplaceIntegration.workspace_id == current_user.workspace_id,
            MarketplaceIntegration.is_active == True
        )
    ).all()

    result = []
    for integration in integrations:
        # Get orders for this integration
        orders = db.query(UnifiedOrder).filter(
            UnifiedOrder.marketplace_integration_id == integration.id
        ).all()

        total_orders = len(orders)
        total_revenue = sum(o.total for o in orders)
        avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

        # Get listings
        listings = db.query(ProductListing).filter(
            ProductListing.marketplace_integration_id == integration.id
        ).all()

        active_listings = sum(1 for l in listings if l.status == ListingStatus.ACTIVE)

        result.append({
            "marketplace_integration_id": integration.id,
            "marketplace": integration.marketplace.value,
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "avg_order_value": avg_order_value,
            "active_listings": active_listings,
            "total_listings": len(listings),
            "conversion_rate": 2.5,  # TODO: Calculate real conversion
            "orders_growth": 15.0,  # TODO: Calculate real growth
            "revenue_growth": 12.0,  # TODO: Calculate real growth
        })

    return result
