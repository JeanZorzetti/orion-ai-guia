"""
Stock Reports Endpoints - Relatórios de Estoque
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, case
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from decimal import Decimal

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.stock_adjustment import StockAdjustment
from app.models.inventory import InventoryCycleCount


router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class StockStatistics(BaseModel):
    total_products: int
    total_stock_value: float
    products_below_minimum: int
    products_out_of_stock: int


class ProductStockPosition(BaseModel):
    id: int
    sku: str
    name: str
    category: Optional[str]
    quantity_in_stock: int
    minimum_stock: int
    unit_cost: float
    total_value: float
    status: str  # 'normal', 'low', 'critical', 'out'


class StockMovementConsolidated(BaseModel):
    period_start: datetime
    period_end: datetime
    total_entries: int
    total_exits: int
    total_corrections: int
    net_movement: int


class ProductBelowMinimum(BaseModel):
    id: int
    sku: str
    name: str
    quantity_in_stock: int
    minimum_stock: int
    difference: int
    unit_cost: float
    status: str  # 'low' or 'critical'


class StockTurnoverMetric(BaseModel):
    product_id: int
    product_sku: str
    product_name: str
    stock_quantity: int
    movements_count: int
    turnover_rate: float
    status: str  # 'fast', 'medium', 'slow', 'stopped'


class StockValueByCategory(BaseModel):
    category: str
    total_products: int
    total_quantity: int
    total_value: float
    percentage: float


class InventoryReportSummary(BaseModel):
    count_id: int
    code: str
    name: str
    date: datetime
    responsible_user_name: str
    total_items: int
    items_with_discrepancy: int
    discrepancy_percentage: float


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/statistics", response_model=StockStatistics)
def get_stock_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas gerais do estoque
    """
    # Total de produtos ativos
    total_products = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True
        )
    ).count()

    # Valor total em estoque
    total_value = db.query(
        func.sum(Product.quantity_in_stock * Product.unit_cost)
    ).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True
        )
    ).scalar() or 0.0

    # Produtos abaixo do mínimo
    products_below = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True,
            Product.quantity_in_stock < Product.minimum_stock
        )
    ).count()

    # Produtos sem estoque
    products_out = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True,
            Product.quantity_in_stock == 0
        )
    ).count()

    return StockStatistics(
        total_products=total_products,
        total_stock_value=float(total_value),
        products_below_minimum=products_below,
        products_out_of_stock=products_out
    )


@router.get("/position", response_model=List[ProductStockPosition])
def get_stock_position(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # 'low', 'critical', 'out', 'normal'
    limit: int = Query(500, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna posição atual de estoque de todos os produtos
    """
    query = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True
        )
    )

    if category:
        query = query.filter(Product.category == category)

    products = query.limit(limit).all()

    result = []
    for product in products:
        qty = product.quantity_in_stock or 0
        min_qty = product.minimum_stock or 0
        cost = product.unit_cost or 0
        total_value = qty * cost

        # Determinar status
        if qty == 0:
            item_status = 'out'
        elif qty < min_qty * 0.5:  # Menos de 50% do mínimo = crítico
            item_status = 'critical'
        elif qty < min_qty:
            item_status = 'low'
        else:
            item_status = 'normal'

        # Filtrar por status se especificado
        if status and item_status != status:
            continue

        result.append(ProductStockPosition(
            id=product.id,
            sku=product.sku,
            name=product.name,
            category=product.category,
            quantity_in_stock=qty,
            minimum_stock=min_qty,
            unit_cost=float(cost),
            total_value=float(total_value),
            status=item_status
        ))

    return result


@router.get("/movements/consolidated", response_model=StockMovementConsolidated)
def get_consolidated_movements(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna movimentações consolidadas por período
    """
    # Default para o mês atual
    if not end_date:
        end_date = datetime.now()
    if not start_date:
        start_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Contar entradas
    entries = db.query(StockAdjustment).filter(
        and_(
            StockAdjustment.workspace_id == current_user.workspace_id,
            StockAdjustment.adjustment_type == 'in',
            StockAdjustment.created_at >= start_date,
            StockAdjustment.created_at <= end_date
        )
    ).count()

    # Contar saídas
    exits = db.query(StockAdjustment).filter(
        and_(
            StockAdjustment.workspace_id == current_user.workspace_id,
            StockAdjustment.adjustment_type == 'out',
            StockAdjustment.created_at >= start_date,
            StockAdjustment.created_at <= end_date
        )
    ).count()

    # Contar correções
    corrections = db.query(StockAdjustment).filter(
        and_(
            StockAdjustment.workspace_id == current_user.workspace_id,
            StockAdjustment.adjustment_type == 'correction',
            StockAdjustment.created_at >= start_date,
            StockAdjustment.created_at <= end_date
        )
    ).count()

    return StockMovementConsolidated(
        period_start=start_date,
        period_end=end_date,
        total_entries=entries,
        total_exits=exits,
        total_corrections=corrections,
        net_movement=entries - exits
    )


@router.get("/below-minimum", response_model=List[ProductBelowMinimum])
def get_products_below_minimum(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna produtos abaixo do estoque mínimo
    """
    products = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True,
            Product.quantity_in_stock < Product.minimum_stock
        )
    ).all()

    result = []
    for product in products:
        qty = product.quantity_in_stock or 0
        min_qty = product.minimum_stock or 0
        difference = min_qty - qty

        # Determinar criticidade
        if qty < min_qty * 0.5:
            status = 'critical'
        else:
            status = 'low'

        result.append(ProductBelowMinimum(
            id=product.id,
            sku=product.sku,
            name=product.name,
            quantity_in_stock=qty,
            minimum_stock=min_qty,
            difference=difference,
            unit_cost=float(product.unit_cost or 0),
            status=status
        ))

    # Ordenar por criticidade (crítico primeiro) e depois por diferença
    result.sort(key=lambda x: (x.status != 'critical', -x.difference))

    return result


@router.get("/turnover", response_model=List[StockTurnoverMetric])
def get_stock_turnover(
    days: int = Query(30, ge=7, le=365),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna análise de giro de estoque
    """
    start_date = datetime.now() - timedelta(days=days)

    products = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True
        )
    ).limit(limit).all()

    result = []
    for product in products:
        # Contar movimentações do produto no período
        movements_count = db.query(StockAdjustment).filter(
            and_(
                StockAdjustment.workspace_id == current_user.workspace_id,
                StockAdjustment.product_id == product.id,
                StockAdjustment.created_at >= start_date
            )
        ).count()

        qty = product.quantity_in_stock or 0

        # Calcular taxa de giro (movimentações por dia)
        turnover_rate = movements_count / days if days > 0 else 0

        # Determinar status
        if turnover_rate >= 1.0:
            status = 'fast'
        elif turnover_rate >= 0.5:
            status = 'medium'
        elif turnover_rate > 0:
            status = 'slow'
        else:
            status = 'stopped'

        result.append(StockTurnoverMetric(
            product_id=product.id,
            product_sku=product.sku,
            product_name=product.name,
            stock_quantity=qty,
            movements_count=movements_count,
            turnover_rate=round(turnover_rate, 2),
            status=status
        ))

    # Ordenar por taxa de giro (maior primeiro)
    result.sort(key=lambda x: x.turnover_rate, reverse=True)

    return result


@router.get("/value-by-category", response_model=List[StockValueByCategory])
def get_stock_value_by_category(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna valor de estoque agrupado por categoria
    """
    # Buscar produtos com suas categorias
    products = db.query(Product).filter(
        and_(
            Product.workspace_id == current_user.workspace_id,
            Product.active == True
        )
    ).all()

    # Agrupar por categoria
    categories = {}
    total_value = 0.0

    for product in products:
        category = product.category or "Sem Categoria"
        qty = product.quantity_in_stock or 0
        cost = product.unit_cost or 0
        value = qty * cost

        if category not in categories:
            categories[category] = {
                'total_products': 0,
                'total_quantity': 0,
                'total_value': 0.0
            }

        categories[category]['total_products'] += 1
        categories[category]['total_quantity'] += qty
        categories[category]['total_value'] += float(value)
        total_value += float(value)

    # Converter para lista com percentuais
    result = []
    for category, data in categories.items():
        percentage = (data['total_value'] / total_value * 100) if total_value > 0 else 0

        result.append(StockValueByCategory(
            category=category,
            total_products=data['total_products'],
            total_quantity=data['total_quantity'],
            total_value=data['total_value'],
            percentage=round(percentage, 2)
        ))

    # Ordenar por valor (maior primeiro)
    result.sort(key=lambda x: x.total_value, reverse=True)

    return result


@router.get("/inventory-reports", response_model=List[InventoryReportSummary])
def get_inventory_reports(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna resumo dos relatórios de inventário (contagens físicas)
    """
    counts = db.query(InventoryCycleCount).filter(
        and_(
            InventoryCycleCount.workspace_id == current_user.workspace_id,
            InventoryCycleCount.status == 'completed'
        )
    ).order_by(desc(InventoryCycleCount.completed_at)).limit(limit).all()

    result = []
    for count in counts:
        user = db.query(User).filter(User.id == count.responsible_user_id).first()

        discrepancy_pct = 0.0
        if count.total_items > 0:
            discrepancy_pct = (count.items_with_discrepancy / count.total_items) * 100

        result.append(InventoryReportSummary(
            count_id=count.id,
            code=count.code,
            name=count.name,
            date=count.completed_at or count.created_at,
            responsible_user_name=user.full_name if user else "Usuário não encontrado",
            total_items=count.total_items,
            items_with_discrepancy=count.items_with_discrepancy,
            discrepancy_percentage=round(discrepancy_pct, 2)
        ))

    return result
