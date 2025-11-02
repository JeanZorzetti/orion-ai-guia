from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.warehouse import Warehouse, WarehouseArea, StockTransfer, TransferStatus
from app.models.product import Product
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_warehouses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os depósitos do workspace
    """
    query = db.query(Warehouse).filter(
        Warehouse.workspace_id == current_user.workspace_id
    )

    if is_active is not None:
        query = query.filter(Warehouse.is_active == is_active)

    warehouses = query.offset(skip).limit(limit).all()

    result = []
    for warehouse in warehouses:
        # Buscar áreas do depósito
        areas = db.query(WarehouseArea).filter(
            WarehouseArea.warehouse_id == warehouse.id,
            WarehouseArea.workspace_id == current_user.workspace_id
        ).all()

        areas_data = [{
            "id": area.id,
            "warehouse_id": area.warehouse_id,
            "name": area.name,
            "type": area.type.value,
            "capacity": area.capacity,
            "current_occupation": area.current_occupation,
            "is_active": area.is_active,
            "requires_refrigeration": area.requires_refrigeration,
            "temperature_range": area.temperature_range
        } for area in areas]

        result.append({
            "id": warehouse.id,
            "name": warehouse.name,
            "code": warehouse.code,
            "workspace_id": warehouse.workspace_id,
            "address": warehouse.address,
            "is_main": warehouse.is_main,
            "is_active": warehouse.is_active,
            "type": warehouse.type.value,
            "total_capacity": warehouse.total_capacity,
            "current_occupation": warehouse.current_occupation,
            "areas": areas_data,
            "manager_id": warehouse.manager_id,
            "manager_name": warehouse.manager_name,
            "contact_phone": warehouse.contact_phone,
            "contact_email": warehouse.contact_email,
            "latitude": warehouse.latitude,
            "longitude": warehouse.longitude,
            "created_at": warehouse.created_at.isoformat(),
            "updated_at": warehouse.updated_at.isoformat()
        })

    return result


@router.get("/stats")
def get_warehouse_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de depósitos
    """
    # Total de depósitos
    total_warehouses = db.query(func.count(Warehouse.id)).filter(
        Warehouse.workspace_id == current_user.workspace_id
    ).scalar() or 0

    # Depósitos ativos
    active_warehouses = db.query(func.count(Warehouse.id)).filter(
        Warehouse.workspace_id == current_user.workspace_id,
        Warehouse.is_active == True
    ).scalar() or 0

    # Transferências pendentes
    pending_transfers = db.query(func.count(StockTransfer.id)).filter(
        StockTransfer.workspace_id == current_user.workspace_id,
        StockTransfer.status == TransferStatus.PENDING
    ).scalar() or 0

    # Transferências em trânsito
    in_transit_transfers = db.query(func.count(StockTransfer.id)).filter(
        StockTransfer.workspace_id == current_user.workspace_id,
        StockTransfer.status == TransferStatus.IN_TRANSIT
    ).scalar() or 0

    # Capacidade total
    total_capacity_query = db.query(
        func.sum(Warehouse.total_capacity)
    ).filter(
        Warehouse.workspace_id == current_user.workspace_id,
        Warehouse.is_active == True
    ).scalar()

    total_capacity = float(total_capacity_query) if total_capacity_query else 0.0

    # Ocupação total
    total_occupation_query = db.query(
        func.sum(Warehouse.current_occupation)
    ).filter(
        Warehouse.workspace_id == current_user.workspace_id,
        Warehouse.is_active == True
    ).scalar()

    total_occupation = float(total_occupation_query) if total_occupation_query else 0.0

    return {
        "total_warehouses": total_warehouses,
        "active_warehouses": active_warehouses,
        "pending_transfers": pending_transfers,
        "in_transit_transfers": in_transit_transfers,
        "total_capacity": total_capacity,
        "total_occupation": total_occupation,
        "occupation_percentage": (total_occupation / total_capacity * 100) if total_capacity > 0 else 0
    }


@router.get("/transfers")
def list_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista transferências de estoque entre depósitos
    """
    query = db.query(StockTransfer, Warehouse, Warehouse, Product).join(
        Warehouse, StockTransfer.from_warehouse_id == Warehouse.id, isouter=True
    ).join(
        Warehouse, StockTransfer.to_warehouse_id == Warehouse.id, isouter=True
    ).join(
        Product, StockTransfer.product_id == Product.id, isouter=True
    ).filter(
        StockTransfer.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(StockTransfer.status == status)

    query = query.order_by(StockTransfer.requested_date.desc())

    results = query.offset(skip).limit(limit).all()

    transfers = []
    for transfer, from_wh, to_wh, product in results:
        # Buscar depósitos corretamente
        from_warehouse = db.query(Warehouse).filter(Warehouse.id == transfer.from_warehouse_id).first()
        to_warehouse = db.query(Warehouse).filter(Warehouse.id == transfer.to_warehouse_id).first()
        product_obj = db.query(Product).filter(Product.id == transfer.product_id).first()

        transfers.append({
            "id": transfer.id,
            "transfer_number": transfer.transfer_number,
            "from_warehouse_id": transfer.from_warehouse_id,
            "from_warehouse_name": from_warehouse.name if from_warehouse else None,
            "to_warehouse_id": transfer.to_warehouse_id,
            "to_warehouse_name": to_warehouse.name if to_warehouse else None,
            "product_id": transfer.product_id,
            "product_name": product_obj.name if product_obj else None,
            "batch_id": transfer.batch_id,
            "quantity": transfer.quantity,
            "status": transfer.status.value,
            "requested_date": transfer.requested_date.isoformat(),
            "approved_date": transfer.approved_date.isoformat() if transfer.approved_date else None,
            "shipped_date": transfer.shipped_date.isoformat() if transfer.shipped_date else None,
            "received_date": transfer.received_date.isoformat() if transfer.received_date else None,
            "cancelled_date": transfer.cancelled_date.isoformat() if transfer.cancelled_date else None,
            "requested_by": transfer.requested_by,
            "notes": transfer.notes,
            "cancellation_reason": transfer.cancellation_reason
        })

    return transfers
