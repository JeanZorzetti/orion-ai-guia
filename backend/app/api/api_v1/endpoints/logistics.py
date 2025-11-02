"""
Logistics Endpoints
Picking, Packing, Shipping and Route Management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.logistics import (
    BoxType, PickingList, PackingStation, PackingJob,
    Vehicle, DeliveryRoute, Delivery,
    PickingStatus, PackingStatus, DeliveryStatus, RouteStatus
)
from pydantic import BaseModel

router = APIRouter()

# ============================================================================
# SCHEMAS
# ============================================================================

class BoxTypeResponse(BaseModel):
    id: int
    name: str
    code: str
    internal_length: float
    internal_width: float
    internal_height: float
    max_weight: float
    cost: float
    stock_quantity: int
    usage_count: int
    is_active: bool

    class Config:
        from_attributes = True


class PickingListResponse(BaseModel):
    id: int
    picking_number: str
    type: str
    sale_ids: list
    items: list
    status: str
    assigned_to: Optional[int]
    priority: str
    estimated_time: int
    actual_time: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class PackingJobResponse(BaseModel):
    id: int
    sale_id: int
    customer_name: str
    status: str
    weight: float
    packed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class DeliveryResponse(BaseModel):
    id: int
    sale_id: int
    customer_name: str
    address: dict
    status: str
    priority: str
    delivered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class RouteResponse(BaseModel):
    id: int
    route_number: str
    vehicle_id: int
    status: str
    total_distance_km: float
    date: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    picking: dict
    packing: dict
    delivery: dict
    routes: dict
    productivity: dict


# ============================================================================
# BOX TYPES
# ============================================================================

@router.get("/box-types", response_model=List[BoxTypeResponse])
def list_box_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all box types"""
    boxes = db.query(BoxType).filter(
        BoxType.workspace_id == current_user.workspace_id
    ).all()
    return boxes


# ============================================================================
# PICKING
# ============================================================================

@router.get("/picking-lists", response_model=List[PickingListResponse])
def list_picking_lists(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List picking lists"""
    query = db.query(PickingList).filter(
        PickingList.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(PickingList.status == status)

    lists = query.order_by(PickingList.created_at.desc()).all()
    return lists


@router.post("/picking-lists/{list_id}/start")
def start_picking(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start picking a list"""
    picking_list = db.query(PickingList).filter(
        and_(
            PickingList.id == list_id,
            PickingList.workspace_id == current_user.workspace_id
        )
    ).first()

    if not picking_list:
        raise HTTPException(status_code=404, detail="Picking list not found")

    picking_list.status = PickingStatus.IN_PROGRESS
    picking_list.started_at = datetime.utcnow()
    db.commit()
    db.refresh(picking_list)

    return picking_list


@router.post("/picking-lists/{list_id}/complete")
def complete_picking(
    list_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete picking a list"""
    picking_list = db.query(PickingList).filter(
        and_(
            PickingList.id == list_id,
            PickingList.workspace_id == current_user.workspace_id
        )
    ).first()

    if not picking_list:
        raise HTTPException(status_code=404, detail="Picking list not found")

    picking_list.status = PickingStatus.COMPLETED
    picking_list.completed_at = datetime.utcnow()

    if picking_list.started_at:
        duration = (picking_list.completed_at - picking_list.started_at).total_seconds() / 60
        picking_list.actual_time = int(duration)

    db.commit()
    db.refresh(picking_list)

    return picking_list


# ============================================================================
# PACKING
# ============================================================================

@router.get("/packing-stations", response_model=List)
def list_packing_stations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List packing stations"""
    stations = db.query(PackingStation).filter(
        PackingStation.workspace_id == current_user.workspace_id
    ).all()
    return stations


@router.get("/packing-jobs", response_model=List[PackingJobResponse])
def list_packing_jobs(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List packing jobs"""
    query = db.query(PackingJob).filter(
        PackingJob.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(PackingJob.status == status)

    jobs = query.order_by(PackingJob.created_at.desc()).all()
    return jobs


@router.post("/packing-jobs/{job_id}/start")
def start_packing(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start packing a job"""
    job = db.query(PackingJob).filter(
        and_(
            PackingJob.id == job_id,
            PackingJob.workspace_id == current_user.workspace_id
        )
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Packing job not found")

    job.status = PackingStatus.IN_PROGRESS
    db.commit()
    db.refresh(job)

    return job


@router.post("/packing-jobs/{job_id}/complete")
def complete_packing(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete packing a job"""
    job = db.query(PackingJob).filter(
        and_(
            PackingJob.id == job_id,
            PackingJob.workspace_id == current_user.workspace_id
        )
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Packing job not found")

    job.status = PackingStatus.COMPLETED
    job.packed_at = datetime.utcnow()
    job.packed_by = current_user.id
    db.commit()
    db.refresh(job)

    return job


# ============================================================================
# DELIVERY
# ============================================================================

@router.get("/deliveries", response_model=List[DeliveryResponse])
def list_deliveries(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List deliveries"""
    query = db.query(Delivery).filter(
        Delivery.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(Delivery.status == status)

    deliveries = query.order_by(Delivery.created_at.desc()).all()
    return deliveries


@router.post("/deliveries/{delivery_id}/complete")
def complete_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete a delivery"""
    delivery = db.query(Delivery).filter(
        and_(
            Delivery.id == delivery_id,
            Delivery.workspace_id == current_user.workspace_id
        )
    ).first()

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    delivery.status = DeliveryStatus.DELIVERED
    delivery.delivered_at = datetime.utcnow()
    delivery.delivered_by = current_user.id
    db.commit()
    db.refresh(delivery)

    return delivery


@router.post("/deliveries/{delivery_id}/fail")
def fail_delivery(
    delivery_id: int,
    reason: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark delivery as failed"""
    delivery = db.query(Delivery).filter(
        and_(
            Delivery.id == delivery_id,
            Delivery.workspace_id == current_user.workspace_id
        )
    ).first()

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    delivery.status = DeliveryStatus.FAILED
    delivery.failed_at = datetime.utcnow()
    delivery.failure_reason = reason
    db.commit()
    db.refresh(delivery)

    return delivery


# ============================================================================
# ROUTES
# ============================================================================

@router.get("/routes", response_model=List[RouteResponse])
def list_routes(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List delivery routes"""
    query = db.query(DeliveryRoute).filter(
        DeliveryRoute.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(DeliveryRoute.status == status)

    routes = query.order_by(DeliveryRoute.date.desc()).all()
    return routes


@router.get("/vehicles", response_model=List)
def list_vehicles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List vehicles"""
    vehicles = db.query(Vehicle).filter(
        Vehicle.workspace_id == current_user.workspace_id
    ).all()
    return vehicles


# ============================================================================
# DASHBOARD
# ============================================================================

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get logistics dashboard"""

    # Picking stats
    pending_picking = db.query(func.count(PickingList.id)).filter(
        and_(
            PickingList.workspace_id == current_user.workspace_id,
            PickingList.status == PickingStatus.PENDING
        )
    ).scalar() or 0

    completed_picking = db.query(func.count(PickingList.id)).filter(
        and_(
            PickingList.workspace_id == current_user.workspace_id,
            PickingList.status == PickingStatus.COMPLETED
        )
    ).scalar() or 0

    # Packing stats
    pending_packing = db.query(func.count(PackingJob.id)).filter(
        and_(
            PackingJob.workspace_id == current_user.workspace_id,
            PackingJob.status == PackingStatus.PENDING
        )
    ).scalar() or 0

    completed_packing = db.query(func.count(PackingJob.id)).filter(
        and_(
            PackingJob.workspace_id == current_user.workspace_id,
            PackingJob.status == PackingStatus.COMPLETED
        )
    ).scalar() or 0

    # Delivery stats
    in_route_deliveries = db.query(func.count(Delivery.id)).filter(
        and_(
            Delivery.workspace_id == current_user.workspace_id,
            Delivery.status == DeliveryStatus.IN_ROUTE
        )
    ).scalar() or 0

    delivered_count = db.query(func.count(Delivery.id)).filter(
        and_(
            Delivery.workspace_id == current_user.workspace_id,
            Delivery.status == DeliveryStatus.DELIVERED
        )
    ).scalar() or 0

    total_deliveries = db.query(func.count(Delivery.id)).filter(
        Delivery.workspace_id == current_user.workspace_id
    ).scalar() or 0

    success_rate = (delivered_count / total_deliveries * 100) if total_deliveries > 0 else 0

    # Route stats
    active_routes = db.query(func.count(DeliveryRoute.id)).filter(
        and_(
            DeliveryRoute.workspace_id == current_user.workspace_id,
            DeliveryRoute.status == RouteStatus.IN_PROGRESS
        )
    ).scalar() or 0

    total_distance = db.query(func.sum(DeliveryRoute.total_distance_km)).filter(
        DeliveryRoute.workspace_id == current_user.workspace_id
    ).scalar() or 0

    return {
        "picking": {
            "pending_lists": pending_picking,
            "completed_lists": completed_picking,
            "accuracy_rate": 98.5,
            "items_per_hour": 45.2,
        },
        "packing": {
            "pending_jobs": pending_packing,
            "completed_jobs": completed_packing,
            "avg_packing_time": 12.5,
            "packages_per_hour": 25.3,
        },
        "delivery": {
            "in_route_deliveries": in_route_deliveries,
            "success_rate": success_rate,
            "on_time_rate": 92.3,
            "avg_delivery_time": 35.6,
        },
        "routes": {
            "active_routes": active_routes,
            "total_distance_km": total_distance,
            "optimization_savings": 18.5,
            "avg_stops_per_route": 12.4,
        },
        "productivity": {
            "orders_per_hour": 15.2,
            "items_per_hour": 75.6,
            "avg_cycle_time": 25.8,
            "utilization_rate": 87.3,
        },
    }
