from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.models.automation import (
    StockOptimization, PurchaseSuggestion, StockAlert, AlertRule,
    RecommendedAction, SuggestionPriority, SuggestionStatus,
    AlertType, AlertSeverity, AlertStatus
)
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.models.batch import ProductBatch
from app.models.supplier import Supplier
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


# ============================================
# STOCK OPTIMIZATIONS
# ============================================

@router.get("/optimizations")
def list_optimizations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    product_id: Optional[int] = Query(None),
    warehouse_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista otimizações de estoque calculadas
    """
    query = db.query(StockOptimization, Product).join(
        Product, StockOptimization.product_id == Product.id
    ).filter(
        StockOptimization.workspace_id == current_user.workspace_id
    )

    if product_id:
        query = query.filter(StockOptimization.product_id == product_id)

    if warehouse_id:
        query = query.filter(StockOptimization.warehouse_id == warehouse_id)

    if action:
        query = query.filter(StockOptimization.recommended_action == action)

    # Ordenar por ação recomendada (urgente primeiro)
    action_order = {
        RecommendedAction.ORDER_NOW: 0,
        RecommendedAction.ORDER_SOON: 1,
        RecommendedAction.SUFFICIENT: 2,
        RecommendedAction.EXCESS: 3
    }

    results = query.offset(skip).limit(limit).all()

    optimizations = []
    for opt, product in results:
        optimizations.append({
            "id": opt.id,
            "product_id": opt.product_id,
            "product_name": product.name,
            "warehouse_id": opt.warehouse_id,
            "reorder_point": opt.reorder_point,
            "safety_stock": opt.safety_stock,
            "optimal_order_quantity": opt.optimal_order_quantity,
            "max_stock_level": opt.max_stock_level,
            "avg_daily_demand": opt.avg_daily_demand,
            "lead_time_days": opt.lead_time_days,
            "service_level_target": opt.service_level_target,
            "holding_cost_per_unit": opt.holding_cost_per_unit,
            "ordering_cost": opt.ordering_cost,
            "stockout_cost_estimate": opt.stockout_cost_estimate,
            "current_stock": opt.current_stock,
            "recommended_action": opt.recommended_action.value,
            "days_until_stockout": opt.days_until_stockout,
            "suggested_order_date": opt.suggested_order_date.isoformat() if opt.suggested_order_date else None,
            "updated_at": opt.updated_at.isoformat()
        })

    # Ordenar por prioridade
    optimizations.sort(key=lambda x: action_order.get(
        RecommendedAction(x["recommended_action"]), 99
    ))

    return optimizations


@router.get("/optimizations/stats")
def get_optimization_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de otimização de estoque
    """
    total = db.query(func.count(StockOptimization.id)).filter(
        StockOptimization.workspace_id == current_user.workspace_id
    ).scalar() or 0

    order_now = db.query(func.count(StockOptimization.id)).filter(
        StockOptimization.workspace_id == current_user.workspace_id,
        StockOptimization.recommended_action == RecommendedAction.ORDER_NOW
    ).scalar() or 0

    order_soon = db.query(func.count(StockOptimization.id)).filter(
        StockOptimization.workspace_id == current_user.workspace_id,
        StockOptimization.recommended_action == RecommendedAction.ORDER_SOON
    ).scalar() or 0

    excess = db.query(func.count(StockOptimization.id)).filter(
        StockOptimization.workspace_id == current_user.workspace_id,
        StockOptimization.recommended_action == RecommendedAction.EXCESS
    ).scalar() or 0

    return {
        "total_products": total,
        "order_now": order_now,
        "order_soon": order_soon,
        "excess_stock": excess,
        "sufficient": total - order_now - order_soon - excess
    }


# ============================================
# PURCHASE SUGGESTIONS
# ============================================

@router.get("/suggestions")
def list_suggestions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista sugestões de compra
    """
    query = db.query(PurchaseSuggestion, Product).join(
        Product, PurchaseSuggestion.product_id == Product.id
    ).filter(
        PurchaseSuggestion.workspace_id == current_user.workspace_id
    )

    if priority:
        query = query.filter(PurchaseSuggestion.priority == priority)

    if status:
        query = query.filter(PurchaseSuggestion.status == status)

    if product_id:
        query = query.filter(PurchaseSuggestion.product_id == product_id)

    # Ordenar por prioridade
    query = query.order_by(PurchaseSuggestion.priority, PurchaseSuggestion.order_by_date)

    results = query.offset(skip).limit(limit).all()

    suggestions = []
    for suggestion, product in results:
        # Buscar fornecedor recomendado
        supplier = None
        if suggestion.recommended_supplier_id:
            supplier = db.query(Supplier).filter(
                Supplier.id == suggestion.recommended_supplier_id
            ).first()

        suggestions.append({
            "id": suggestion.id,
            "product_id": suggestion.product_id,
            "product_name": product.name,
            "suggested_quantity": suggestion.suggested_quantity,
            "estimated_cost": suggestion.estimated_cost,
            "priority": suggestion.priority.value,
            "reason": suggestion.reason,
            "forecast_demand": suggestion.forecast_demand,
            "current_stock": suggestion.current_stock,
            "lead_time_days": suggestion.lead_time_days,
            "recommended_supplier_id": suggestion.recommended_supplier_id,
            "recommended_supplier_name": supplier.company_name if supplier else None,
            "alternative_suppliers": suggestion.alternative_suppliers,
            "order_by_date": suggestion.order_by_date.isoformat(),
            "expected_delivery_date": suggestion.expected_delivery_date.isoformat() if suggestion.expected_delivery_date else None,
            "status": suggestion.status.value,
            "approved_by": suggestion.approved_by,
            "approved_at": suggestion.approved_at.isoformat() if suggestion.approved_at else None,
            "dismissed_reason": suggestion.dismissed_reason,
            "created_at": suggestion.created_at.isoformat(),
            "updated_at": suggestion.updated_at.isoformat()
        })

    return suggestions


@router.get("/suggestions/stats")
def get_suggestion_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de sugestões de compra
    """
    total = db.query(func.count(PurchaseSuggestion.id)).filter(
        PurchaseSuggestion.workspace_id == current_user.workspace_id
    ).scalar() or 0

    pending = db.query(func.count(PurchaseSuggestion.id)).filter(
        PurchaseSuggestion.workspace_id == current_user.workspace_id,
        PurchaseSuggestion.status == SuggestionStatus.PENDING
    ).scalar() or 0

    approved = db.query(func.count(PurchaseSuggestion.id)).filter(
        PurchaseSuggestion.workspace_id == current_user.workspace_id,
        PurchaseSuggestion.status == SuggestionStatus.APPROVED
    ).scalar() or 0

    # Valor total de sugestões pendentes
    pending_value_query = db.query(
        func.sum(PurchaseSuggestion.estimated_cost)
    ).filter(
        PurchaseSuggestion.workspace_id == current_user.workspace_id,
        PurchaseSuggestion.status == SuggestionStatus.PENDING
    ).scalar()

    pending_value = float(pending_value_query) if pending_value_query else 0.0

    return {
        "total_suggestions": total,
        "pending_suggestions": pending,
        "approved_suggestions": approved,
        "pending_value": pending_value
    }


# ============================================
# STOCK ALERTS
# ============================================

@router.get("/alerts")
def list_alerts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista alertas de estoque
    """
    query = db.query(StockAlert, Product).join(
        Product, StockAlert.product_id == Product.id
    ).filter(
        StockAlert.workspace_id == current_user.workspace_id
    )

    if type:
        query = query.filter(StockAlert.type == type)

    if severity:
        query = query.filter(StockAlert.severity == severity)

    if status:
        query = query.filter(StockAlert.status == status)

    if product_id:
        query = query.filter(StockAlert.product_id == product_id)

    # Ordenar por severidade e data
    query = query.order_by(StockAlert.severity, StockAlert.created_at.desc())

    results = query.offset(skip).limit(limit).all()

    alerts = []
    for alert, product in results:
        # Buscar warehouse se houver
        warehouse = None
        if alert.warehouse_id:
            warehouse = db.query(Warehouse).filter(Warehouse.id == alert.warehouse_id).first()

        alerts.append({
            "id": alert.id,
            "type": alert.type.value,
            "severity": alert.severity.value,
            "product_id": alert.product_id,
            "product_name": product.name,
            "warehouse_id": alert.warehouse_id,
            "warehouse_name": warehouse.name if warehouse else None,
            "batch_id": alert.batch_id,
            "message": alert.message,
            "current_value": alert.current_value,
            "threshold_value": alert.threshold_value,
            "recommended_action": alert.recommended_action,
            "notify_users": alert.notify_users,
            "notification_channels": alert.notification_channels,
            "sent_at": alert.sent_at.isoformat() if alert.sent_at else None,
            "status": alert.status.value,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
            "resolution_notes": alert.resolution_notes,
            "created_at": alert.created_at.isoformat()
        })

    return alerts


@router.get("/alerts/stats")
def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de alertas
    """
    total = db.query(func.count(StockAlert.id)).filter(
        StockAlert.workspace_id == current_user.workspace_id
    ).scalar() or 0

    active = db.query(func.count(StockAlert.id)).filter(
        StockAlert.workspace_id == current_user.workspace_id,
        StockAlert.status == AlertStatus.ACTIVE
    ).scalar() or 0

    critical = db.query(func.count(StockAlert.id)).filter(
        StockAlert.workspace_id == current_user.workspace_id,
        StockAlert.severity == AlertSeverity.CRITICAL,
        StockAlert.status == AlertStatus.ACTIVE
    ).scalar() or 0

    high = db.query(func.count(StockAlert.id)).filter(
        StockAlert.workspace_id == current_user.workspace_id,
        StockAlert.severity == AlertSeverity.HIGH,
        StockAlert.status == AlertStatus.ACTIVE
    ).scalar() or 0

    acknowledged = db.query(func.count(StockAlert.id)).filter(
        StockAlert.workspace_id == current_user.workspace_id,
        StockAlert.status == AlertStatus.ACKNOWLEDGED
    ).scalar() or 0

    return {
        "total_alerts": total,
        "active_alerts": active,
        "critical_alerts": critical,
        "high_alerts": high,
        "acknowledged_alerts": acknowledged
    }


# ============================================
# ALERT RULES
# ============================================

@router.get("/rules")
def list_rules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = Query(None),
    type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista regras de alerta
    """
    query = db.query(AlertRule).filter(
        AlertRule.workspace_id == current_user.workspace_id
    )

    if is_active is not None:
        query = query.filter(AlertRule.is_active == is_active)

    if type:
        query = query.filter(AlertRule.type == type)

    query = query.order_by(AlertRule.is_active.desc(), AlertRule.name)

    rules = query.offset(skip).limit(limit).all()

    result = []
    for rule in rules:
        result.append({
            "id": rule.id,
            "name": rule.name,
            "description": rule.description,
            "type": rule.type.value,
            "is_active": rule.is_active,
            "conditions": rule.conditions,
            "applies_to": rule.applies_to,
            "category_ids": rule.category_ids,
            "product_ids": rule.product_ids,
            "warehouse_ids": rule.warehouse_ids,
            "auto_actions": rule.auto_actions,
            "notification_template": rule.notification_template,
            "notify_users": rule.notify_users,
            "notification_channels": rule.notification_channels,
            "check_frequency": rule.check_frequency,
            "last_checked_at": rule.last_checked_at.isoformat() if rule.last_checked_at else None,
            "created_by": rule.created_by,
            "created_at": rule.created_at.isoformat(),
            "updated_at": rule.updated_at.isoformat()
        })

    return result


@router.get("/rules/stats")
def get_rule_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de regras
    """
    total = db.query(func.count(AlertRule.id)).filter(
        AlertRule.workspace_id == current_user.workspace_id
    ).scalar() or 0

    active = db.query(func.count(AlertRule.id)).filter(
        AlertRule.workspace_id == current_user.workspace_id,
        AlertRule.is_active == True
    ).scalar() or 0

    return {
        "total_rules": total,
        "active_rules": active,
        "inactive_rules": total - active
    }
