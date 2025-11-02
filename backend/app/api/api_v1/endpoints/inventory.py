"""
Inventory Cycle Count Endpoints - Contagem Cíclica de Estoque
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
from app.models.inventory import (
    InventoryCycleCount,
    InventoryCountItem,
    InventoryStatus,
    CountItemStatus
)
from app.models.product import Product
from app.models.stock_adjustment import StockAdjustment


router = APIRouter()


# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class InventoryCycleCountResponse(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str]
    status: str
    responsible_user_id: int
    responsible_user_name: str
    scheduled_date: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    total_items: int
    items_counted: int
    items_with_discrepancy: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class InventoryCycleCountSummary(BaseModel):
    total_counts: int
    in_progress: int
    completed: int
    total_discrepancies: int


class CreateInventoryCountRequest(BaseModel):
    name: str
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None
    product_ids: Optional[List[int]] = None  # Se None, conta todos os produtos


class InventoryCountItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_code: str
    expected_quantity: int
    counted_quantity: Optional[int]
    final_quantity: Optional[int]
    discrepancy: Optional[int]
    status: str
    counted_by_user_id: Optional[int]
    counted_by_user_name: Optional[str]
    counted_at: Optional[datetime]
    notes: Optional[str]
    discrepancy_reason: Optional[str]
    adjustment_applied: bool


class UpdateCountItemRequest(BaseModel):
    counted_quantity: int
    notes: Optional[str] = None


class ResolveDiscrepancyRequest(BaseModel):
    final_quantity: int
    discrepancy_reason: str
    apply_adjustment: bool = True


# ============================================================================
# CYCLE COUNT ENDPOINTS
# ============================================================================

@router.get("/cycle-counts", response_model=List[InventoryCycleCountResponse])
def list_inventory_counts(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as contagens de inventário
    """
    query = db.query(InventoryCycleCount).filter(
        InventoryCycleCount.workspace_id == current_user.workspace_id
    )

    if status:
        query = query.filter(InventoryCycleCount.status == status)

    counts = query.order_by(desc(InventoryCycleCount.created_at)).limit(limit).all()

    result = []
    for count in counts:
        user = db.query(User).filter(User.id == count.responsible_user_id).first()

        result.append(InventoryCycleCountResponse(
            id=count.id,
            code=count.code,
            name=count.name,
            description=count.description,
            status=count.status.value,
            responsible_user_id=count.responsible_user_id,
            responsible_user_name=user.full_name if user else "Usuário não encontrado",
            scheduled_date=count.scheduled_date,
            started_at=count.started_at,
            completed_at=count.completed_at,
            total_items=count.total_items,
            items_counted=count.items_counted,
            items_with_discrepancy=count.items_with_discrepancy,
            notes=count.notes,
            created_at=count.created_at,
            updated_at=count.updated_at
        ))

    return result


@router.get("/cycle-counts/summary", response_model=InventoryCycleCountSummary)
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna resumo das contagens de inventário
    """
    query = db.query(InventoryCycleCount).filter(
        InventoryCycleCount.workspace_id == current_user.workspace_id
    )

    total_counts = query.count()
    in_progress = query.filter(InventoryCycleCount.status == InventoryStatus.IN_PROGRESS).count()
    completed = query.filter(InventoryCycleCount.status == InventoryStatus.COMPLETED).count()

    # Total de discrepâncias
    total_discrepancies = db.query(func.sum(InventoryCycleCount.items_with_discrepancy)).filter(
        InventoryCycleCount.workspace_id == current_user.workspace_id
    ).scalar() or 0

    return InventoryCycleCountSummary(
        total_counts=total_counts,
        in_progress=in_progress,
        completed=completed,
        total_discrepancies=int(total_discrepancies)
    )


@router.post("/cycle-counts")
def create_inventory_count(
    request: CreateInventoryCountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova contagem de inventário
    """
    # Gerar código único
    year = datetime.now().year
    last_count = db.query(InventoryCycleCount).filter(
        InventoryCycleCount.workspace_id == current_user.workspace_id,
        InventoryCycleCount.code.like(f"INV-{year}-%")
    ).order_by(desc(InventoryCycleCount.id)).first()

    if last_count:
        last_number = int(last_count.code.split("-")[-1])
        code = f"INV-{year}-{last_number + 1:03d}"
    else:
        code = f"INV-{year}-001"

    # Criar contagem
    count = InventoryCycleCount(
        workspace_id=current_user.workspace_id,
        code=code,
        name=request.name,
        description=request.description,
        status=InventoryStatus.PENDING,
        responsible_user_id=current_user.id,
        scheduled_date=request.scheduled_date,
        notes=request.notes
    )

    db.add(count)
    db.flush()

    # Buscar produtos para contar
    if request.product_ids:
        products = db.query(Product).filter(
            and_(
                Product.workspace_id == current_user.workspace_id,
                Product.id.in_(request.product_ids)
            )
        ).all()
    else:
        # Contar todos os produtos ativos
        products = db.query(Product).filter(
            and_(
                Product.workspace_id == current_user.workspace_id,
                Product.active == True
            )
        ).all()

    # Criar itens de contagem
    for product in products:
        item = InventoryCountItem(
            workspace_id=current_user.workspace_id,
            cycle_count_id=count.id,
            product_id=product.id,
            expected_quantity=product.quantity_in_stock or 0,
            status=CountItemStatus.PENDING
        )
        db.add(item)

    count.total_items = len(products)

    db.commit()
    db.refresh(count)

    return {
        "success": True,
        "count_id": count.id,
        "code": count.code,
        "total_items": count.total_items
    }


@router.get("/cycle-counts/{count_id}", response_model=InventoryCycleCountResponse)
def get_count_by_id(
    count_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca uma contagem específica por ID
    """
    count = db.query(InventoryCycleCount).filter(
        and_(
            InventoryCycleCount.id == count_id,
            InventoryCycleCount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not count:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")

    user = db.query(User).filter(User.id == count.responsible_user_id).first()

    return InventoryCycleCountResponse(
        id=count.id,
        code=count.code,
        name=count.name,
        description=count.description,
        status=count.status.value,
        responsible_user_id=count.responsible_user_id,
        responsible_user_name=user.full_name if user else "Usuário não encontrado",
        scheduled_date=count.scheduled_date,
        started_at=count.started_at,
        completed_at=count.completed_at,
        total_items=count.total_items,
        items_counted=count.items_counted,
        items_with_discrepancy=count.items_with_discrepancy,
        notes=count.notes,
        created_at=count.created_at,
        updated_at=count.updated_at
    )


@router.post("/cycle-counts/{count_id}/start")
def start_inventory_count(
    count_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Inicia uma contagem de inventário
    """
    count = db.query(InventoryCycleCount).filter(
        and_(
            InventoryCycleCount.id == count_id,
            InventoryCycleCount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not count:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")

    if count.status != InventoryStatus.PENDING:
        raise HTTPException(status_code=400, detail="Contagem já foi iniciada")

    count.status = InventoryStatus.IN_PROGRESS
    count.started_at = datetime.now()

    db.commit()

    return {"success": True, "message": "Contagem iniciada com sucesso"}


@router.post("/cycle-counts/{count_id}/complete")
def complete_inventory_count(
    count_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finaliza uma contagem de inventário
    """
    count = db.query(InventoryCycleCount).filter(
        and_(
            InventoryCycleCount.id == count_id,
            InventoryCycleCount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not count:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")

    if count.status != InventoryStatus.IN_PROGRESS:
        raise HTTPException(status_code=400, detail="Contagem não está em andamento")

    # Verificar se todos os itens foram contados
    pending_items = db.query(InventoryCountItem).filter(
        and_(
            InventoryCountItem.cycle_count_id == count_id,
            InventoryCountItem.status == CountItemStatus.PENDING
        )
    ).count()

    if pending_items > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Ainda há {pending_items} itens pendentes de contagem"
        )

    count.status = InventoryStatus.COMPLETED
    count.completed_at = datetime.now()

    db.commit()

    return {
        "success": True,
        "message": "Contagem finalizada com sucesso",
        "items_with_discrepancy": count.items_with_discrepancy
    }


# ============================================================================
# COUNT ITEM ENDPOINTS
# ============================================================================

@router.get("/cycle-counts/{count_id}/items", response_model=List[InventoryCountItemResponse])
def list_count_items(
    count_id: int,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os itens de uma contagem
    """
    # Verificar se a contagem existe e pertence ao workspace
    count = db.query(InventoryCycleCount).filter(
        and_(
            InventoryCycleCount.id == count_id,
            InventoryCycleCount.workspace_id == current_user.workspace_id
        )
    ).first()

    if not count:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")

    query = db.query(InventoryCountItem).filter(
        InventoryCountItem.cycle_count_id == count_id
    )

    if status:
        query = query.filter(InventoryCountItem.status == status)

    items = query.all()

    result = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        counted_by = None
        if item.counted_by_user_id:
            counted_by = db.query(User).filter(User.id == item.counted_by_user_id).first()

        result.append(InventoryCountItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=product.name if product else "Produto não encontrado",
            product_code=product.sku if product else "N/A",
            expected_quantity=item.expected_quantity,
            counted_quantity=item.counted_quantity,
            final_quantity=item.final_quantity,
            discrepancy=item.discrepancy,
            status=item.status.value,
            counted_by_user_id=item.counted_by_user_id,
            counted_by_user_name=counted_by.full_name if counted_by else None,
            counted_at=item.counted_at,
            notes=item.notes,
            discrepancy_reason=item.discrepancy_reason,
            adjustment_applied=item.adjustment_applied
        ))

    return result


@router.put("/count-items/{item_id}/count")
def update_count_item(
    item_id: int,
    request: UpdateCountItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registra a contagem de um item
    """
    item = db.query(InventoryCountItem).filter(
        and_(
            InventoryCountItem.id == item_id,
            InventoryCountItem.workspace_id == current_user.workspace_id
        )
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    # Atualizar contagem
    item.counted_quantity = request.counted_quantity
    item.discrepancy = request.counted_quantity - item.expected_quantity
    item.counted_by_user_id = current_user.id
    item.counted_at = datetime.now()
    item.notes = request.notes

    # Determinar status
    if item.discrepancy == 0:
        item.status = CountItemStatus.COUNTED
        item.final_quantity = item.counted_quantity
    else:
        item.status = CountItemStatus.DISCREPANCY

    # Atualizar estatísticas da contagem
    count = db.query(InventoryCycleCount).filter(
        InventoryCycleCount.id == item.cycle_count_id
    ).first()

    if count:
        count.items_counted = db.query(InventoryCountItem).filter(
            and_(
                InventoryCountItem.cycle_count_id == count.id,
                InventoryCountItem.status.in_([CountItemStatus.COUNTED, CountItemStatus.DISCREPANCY, CountItemStatus.VERIFIED])
            )
        ).count()

        count.items_with_discrepancy = db.query(InventoryCountItem).filter(
            and_(
                InventoryCountItem.cycle_count_id == count.id,
                InventoryCountItem.status == CountItemStatus.DISCREPANCY
            )
        ).count()

    db.commit()

    return {
        "success": True,
        "discrepancy": item.discrepancy,
        "status": item.status.value
    }


@router.post("/count-items/{item_id}/resolve")
def resolve_discrepancy(
    item_id: int,
    request: ResolveDiscrepancyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolve uma discrepância e aplica ajuste de estoque
    """
    item = db.query(InventoryCountItem).filter(
        and_(
            InventoryCountItem.id == item_id,
            InventoryCountItem.workspace_id == current_user.workspace_id
        )
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")

    if item.status != CountItemStatus.DISCREPANCY:
        raise HTTPException(status_code=400, detail="Item não possui discrepância")

    item.final_quantity = request.final_quantity
    item.discrepancy_reason = request.discrepancy_reason
    item.status = CountItemStatus.VERIFIED

    # Aplicar ajuste se solicitado
    if request.apply_adjustment:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado")

        # Criar ajuste de estoque
        adjustment_type = 'correction'
        quantity_diff = request.final_quantity - item.expected_quantity

        adjustment = StockAdjustment(
            workspace_id=current_user.workspace_id,
            product_id=item.product_id,
            user_id=current_user.id,
            adjustment_type=adjustment_type,
            quantity=abs(quantity_diff),
            previous_quantity=item.expected_quantity,
            new_quantity=request.final_quantity,
            reason=f"Ajuste de inventário - {request.discrepancy_reason}"
        )

        db.add(adjustment)
        db.flush()

        # Atualizar estoque do produto
        product.quantity_in_stock = request.final_quantity

        item.adjustment_applied = True
        item.stock_adjustment_id = adjustment.id

    db.commit()

    return {
        "success": True,
        "adjustment_applied": item.adjustment_applied,
        "new_stock": request.final_quantity
    }
