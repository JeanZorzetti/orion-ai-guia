from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.models.batch import ProductBatch, BatchMovement, BatchStatus, MovementType
from app.models.product import Product
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/")
def list_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    product_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    expiring_in_days: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os lotes do workspace com filtros opcionais

    Filtros disponíveis:
    - product_id: Filtrar por produto específico
    - status: Filtrar por status (active, quarantine, expired, recalled)
    - expiring_in_days: Lotes que vencem em X dias
    - search: Buscar por número do lote ou localização
    """
    query = db.query(ProductBatch).filter(
        ProductBatch.workspace_id == current_user.workspace_id
    )

    # Filtro por produto
    if product_id:
        query = query.filter(ProductBatch.product_id == product_id)

    # Filtro por status
    if status:
        query = query.filter(ProductBatch.status == status)

    # Filtro por expiração próxima
    if expiring_in_days is not None:
        target_date = date.today() + timedelta(days=expiring_in_days)
        query = query.filter(
            ProductBatch.expiry_date <= target_date,
            ProductBatch.expiry_date >= date.today()
        )

    # Busca textual
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ProductBatch.batch_number.ilike(search_term),
                ProductBatch.location.ilike(search_term)
            )
        )

    # Ordenar por data de validade (mais próximos primeiro)
    query = query.order_by(ProductBatch.expiry_date.asc())

    batches = query.offset(skip).limit(limit).all()

    # Calcular days_to_expire e near_expiry para cada lote
    result = []
    today = date.today()
    for batch in batches:
        days_to_expire = (batch.expiry_date - today).days
        near_expiry = days_to_expire >= 0 and days_to_expire < 30

        result.append({
            "id": batch.id,
            "product_id": batch.product_id,
            "batch_number": batch.batch_number,
            "manufacturing_date": batch.manufacturing_date.isoformat(),
            "expiry_date": batch.expiry_date.isoformat(),
            "quantity": batch.quantity,
            "cost_price": batch.cost_price,
            "supplier_id": batch.supplier_id,
            "origin": batch.origin,
            "warehouse_id": batch.warehouse_id,
            "location": batch.location,
            "status": batch.status.value,
            "quality_certificate": batch.quality_certificate,
            "notes": batch.notes,
            "days_to_expire": days_to_expire,
            "near_expiry": near_expiry,
            "created_at": batch.created_at.isoformat(),
            "updated_at": batch.updated_at.isoformat()
        })

    return result


@router.get("/stats")
def get_batch_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de lotes do workspace
    """
    today = date.today()

    # Total de lotes
    total_batches = db.query(func.count(ProductBatch.id)).filter(
        ProductBatch.workspace_id == current_user.workspace_id
    ).scalar() or 0

    # Lotes ativos
    active_batches = db.query(func.count(ProductBatch.id)).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.status == BatchStatus.ACTIVE
    ).scalar() or 0

    # Lotes vencidos
    expired_batches = db.query(func.count(ProductBatch.id)).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.expiry_date < today
    ).scalar() or 0

    # Alertas críticos (vencem em 7 dias)
    critical_date = today + timedelta(days=7)
    critical_alerts = db.query(func.count(ProductBatch.id)).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.expiry_date >= today,
        ProductBatch.expiry_date < critical_date,
        ProductBatch.status == BatchStatus.ACTIVE
    ).scalar() or 0

    # Alertas de atenção (vencem em 30 dias)
    warning_date = today + timedelta(days=30)
    warning_alerts = db.query(func.count(ProductBatch.id)).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.expiry_date >= critical_date,
        ProductBatch.expiry_date < warning_date,
        ProductBatch.status == BatchStatus.ACTIVE
    ).scalar() or 0

    # Valor total dos lotes ativos
    total_value_query = db.query(
        func.sum(ProductBatch.cost_price * ProductBatch.quantity)
    ).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.status == BatchStatus.ACTIVE
    ).scalar()

    total_value = float(total_value_query) if total_value_query else 0.0

    return {
        "total_batches": total_batches,
        "active_batches": active_batches,
        "expired_batches": expired_batches,
        "critical_alerts": critical_alerts,
        "warning_alerts": warning_alerts,
        "total_value": total_value
    }


@router.get("/alerts")
def get_expiry_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna alertas de lotes próximos ao vencimento (90 dias)
    """
    today = date.today()
    alert_date = today + timedelta(days=90)

    batches = db.query(ProductBatch, Product).join(
        Product, ProductBatch.product_id == Product.id
    ).filter(
        ProductBatch.workspace_id == current_user.workspace_id,
        ProductBatch.expiry_date >= today,
        ProductBatch.expiry_date < alert_date,
        ProductBatch.status.in_([BatchStatus.ACTIVE, BatchStatus.QUARANTINE])
    ).order_by(ProductBatch.expiry_date.asc()).all()

    alerts = []
    for batch, product in batches:
        days_remaining = (batch.expiry_date - today).days

        # Determinar severidade
        if days_remaining < 7:
            severity = "critical"
        elif days_remaining < 30:
            severity = "warning"
        else:
            severity = "info"

        alerts.append({
            "id": f"alert-{batch.id}",
            "product_id": batch.product_id,
            "product_name": product.name,
            "batch": {
                "id": batch.id,
                "batch_number": batch.batch_number,
                "manufacturing_date": batch.manufacturing_date.isoformat(),
                "expiry_date": batch.expiry_date.isoformat(),
                "quantity": batch.quantity,
                "cost_price": batch.cost_price,
                "location": batch.location,
                "status": batch.status.value
            },
            "days_remaining": days_remaining,
            "quantity": batch.quantity,
            "severity": severity,
            "action_taken": "none",
            "resolved": False,
            "created_at": datetime.utcnow().isoformat()
        })

    return alerts


@router.get("/{batch_id}/movements")
def get_batch_movements(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o histórico de movimentações de um lote específico
    """
    # Verificar se o lote existe e pertence ao workspace
    batch = db.query(ProductBatch).filter(
        ProductBatch.id == batch_id,
        ProductBatch.workspace_id == current_user.workspace_id
    ).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado"
        )

    # Buscar movimentações
    movements = db.query(BatchMovement).filter(
        BatchMovement.batch_id == batch_id,
        BatchMovement.workspace_id == current_user.workspace_id
    ).order_by(BatchMovement.created_at.desc()).all()

    result = []
    for movement in movements:
        result.append({
            "id": movement.id,
            "batch_id": movement.batch_id,
            "type": movement.type.value,
            "quantity": movement.quantity,
            "from_warehouse_id": movement.from_warehouse_id,
            "to_warehouse_id": movement.to_warehouse_id,
            "reference": movement.reference,
            "notes": movement.notes,
            "user_id": movement.user_id,
            "created_at": movement.created_at.isoformat()
        })

    return result
