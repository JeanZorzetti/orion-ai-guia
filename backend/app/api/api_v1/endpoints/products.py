from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.product import Product
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    DemandForecastResponse
)
from app.services.demand_forecaster import DemandForecaster

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    active_only: Optional[bool] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os produtos do workspace (multi-tenant)
    """
    query = db.query(Product).filter(Product.workspace_id == current_user.workspace_id)

    if active_only is not None:
        query = query.filter(Product.active == active_only)

    if category:
        query = query.filter(Product.category == category)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if low_stock:
        query = query.filter(Product.stock_quantity <= Product.min_stock_level)

    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de um produto específico (multi-tenant)
    """
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    return product


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo produto no workspace do usuário
    """
    # Verifica se SKU já existe (se fornecido)
    if product.sku:
        existing = db.query(Product).filter(
            Product.sku == product.sku,
            Product.workspace_id == current_user.workspace_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU já existe neste workspace"
            )

    db_product = Product(
        **product.model_dump(),
        workspace_id=current_user.workspace_id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um produto existente (multi-tenant)
    """
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Verifica SKU duplicado se estiver sendo atualizado
    if product_update.sku and product_update.sku != db_product.sku:
        existing = db.query(Product).filter(
            Product.sku == product_update.sku,
            Product.workspace_id == current_user.workspace_id,
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU já existe neste workspace"
            )

    # Atualiza apenas os campos fornecidos
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta um produto (multi-tenant)
    """
    db_product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    db.delete(db_product)
    db.commit()
    return None


@router.get("/{product_id}/demand-forecast", response_model=DemandForecastResponse)
def get_demand_forecast(
    product_id: int,
    period: str = Query(default="4_weeks", regex="^(2|4|8|12)_weeks$"),
    granularity: str = Query(default="weekly", regex="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna previsão de demanda para um produto usando Machine Learning

    Este endpoint analisa o histórico de vendas e gera previsões usando
    análise de séries temporais (média móvel + tendência linear).

    Args:
        product_id: ID do produto
        period: Período de previsão (2_weeks, 4_weeks, 8_weeks, 12_weeks)
        granularity: Granularidade dos dados (daily, weekly, monthly)

    Returns:
        DemandForecastResponse com histórico, previsão e insights
    """

    # Parse período
    periods_map = {
        "2_weeks": 2,
        "4_weeks": 4,
        "8_weeks": 8,
        "12_weeks": 12
    }

    periods = periods_map.get(period, 4)

    # Inicializa forecaster
    forecaster = DemandForecaster(db)

    # Gera previsão
    result = forecaster.get_demand_forecast(
        product_id=product_id,
        workspace_id=current_user.workspace_id,
        periods=periods,
        granularity=granularity
    )

    # Retorna resposta
    return result
