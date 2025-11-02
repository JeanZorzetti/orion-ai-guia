"""
Stock Movements Endpoints - Movimentações de Estoque
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.stock_adjustment import StockAdjustment
from app.models.product import Product


router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class StockMovementResponse(BaseModel):
    id: int
    date: datetime
    type: str  # 'in', 'out', 'correction'
    product_id: int
    product_name: str
    product_code: str
    quantity: int
    previous_quantity: int
    new_quantity: int
    user_name: str
    reason: str
    created_at: datetime


class StockMovementSummary(BaseModel):
    total_entries: int
    total_exits: int
    total_movements: int
    period_start: datetime
    period_end: datetime


class CreateStockMovementRequest(BaseModel):
    product_id: int
    adjustment_type: str  # 'in', 'out', 'correction'
    quantity: int
    reason: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/movements", response_model=List[StockMovementResponse])
def list_stock_movements(
    product_id: Optional[int] = Query(None),
    movement_type: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as movimentações de estoque
    """
    query = db.query(StockAdjustment).filter(
        StockAdjustment.workspace_id == current_user.workspace_id
    )

    # Filtros
    if product_id:
        query = query.filter(StockAdjustment.product_id == product_id)

    if movement_type:
        query = query.filter(StockAdjustment.adjustment_type == movement_type)

    if start_date:
        query = query.filter(StockAdjustment.created_at >= start_date)

    if end_date:
        query = query.filter(StockAdjustment.created_at <= end_date)

    # Ordenar por data mais recente
    movements = query.order_by(desc(StockAdjustment.created_at)).limit(limit).all()

    # Converter para response
    result = []
    for mov in movements:
        product = db.query(Product).filter(Product.id == mov.product_id).first()
        user = db.query(User).filter(User.id == mov.user_id).first()

        result.append(StockMovementResponse(
            id=mov.id,
            date=mov.created_at,
            type=mov.adjustment_type,
            product_id=mov.product_id,
            product_name=product.name if product else "Produto não encontrado",
            product_code=product.sku if product else "N/A",
            quantity=mov.quantity,
            previous_quantity=mov.previous_quantity,
            new_quantity=mov.new_quantity,
            user_name=user.full_name if user else "Usuário não encontrado",
            reason=mov.reason,
            created_at=mov.created_at
        ))

    return result


@router.get("/movements/summary", response_model=StockMovementSummary)
def get_movements_summary(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna resumo das movimentações de estoque
    """
    # Default para o mês atual
    if not start_date:
        start_date = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.now()

    query = db.query(StockAdjustment).filter(
        and_(
            StockAdjustment.workspace_id == current_user.workspace_id,
            StockAdjustment.created_at >= start_date,
            StockAdjustment.created_at <= end_date
        )
    )

    # Total de entradas
    total_entries = query.filter(StockAdjustment.adjustment_type == 'in').count()

    # Total de saídas
    total_exits = query.filter(StockAdjustment.adjustment_type == 'out').count()

    # Total de movimentações
    total_movements = query.count()

    return StockMovementSummary(
        total_entries=total_entries,
        total_exits=total_exits,
        total_movements=total_movements,
        period_start=start_date,
        period_end=end_date
    )


@router.post("/movements")
def create_stock_movement(
    request: CreateStockMovementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova movimentação de estoque
    """
    # Buscar produto
    product = db.query(Product).filter(
        and_(
            Product.id == request.product_id,
            Product.workspace_id == current_user.workspace_id
        )
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Validar tipo de movimentação
    if request.adjustment_type not in ['in', 'out', 'correction']:
        raise HTTPException(
            status_code=400,
            detail="Tipo de movimentação inválido. Use 'in', 'out' ou 'correction'"
        )

    # Calcular novo estoque
    previous_quantity = product.quantity_in_stock or 0

    if request.adjustment_type == 'in':
        new_quantity = previous_quantity + request.quantity
    elif request.adjustment_type == 'out':
        if previous_quantity < request.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Estoque insuficiente. Disponível: {previous_quantity}"
            )
        new_quantity = previous_quantity - request.quantity
    else:  # correction
        new_quantity = request.quantity

    # Criar movimentação
    movement = StockAdjustment(
        workspace_id=current_user.workspace_id,
        product_id=request.product_id,
        user_id=current_user.id,
        adjustment_type=request.adjustment_type,
        quantity=request.quantity,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reason=request.reason
    )

    db.add(movement)

    # Atualizar estoque do produto
    product.quantity_in_stock = new_quantity

    db.commit()
    db.refresh(movement)

    return {
        "success": True,
        "movement_id": movement.id,
        "previous_quantity": previous_quantity,
        "new_quantity": new_quantity
    }


@router.get("/movements/{movement_id}", response_model=StockMovementResponse)
def get_movement_by_id(
    movement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca uma movimentação específica por ID
    """
    movement = db.query(StockAdjustment).filter(
        and_(
            StockAdjustment.id == movement_id,
            StockAdjustment.workspace_id == current_user.workspace_id
        )
    ).first()

    if not movement:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")

    product = db.query(Product).filter(Product.id == movement.product_id).first()
    user = db.query(User).filter(User.id == movement.user_id).first()

    return StockMovementResponse(
        id=movement.id,
        date=movement.created_at,
        type=movement.adjustment_type,
        product_id=movement.product_id,
        product_name=product.name if product else "Produto não encontrado",
        product_code=product.sku if product else "N/A",
        quantity=movement.quantity,
        previous_quantity=movement.previous_quantity,
        new_quantity=movement.new_quantity,
        user_name=user.full_name if user else "Usuário não encontrado",
        reason=movement.reason,
        created_at=movement.created_at
    )
