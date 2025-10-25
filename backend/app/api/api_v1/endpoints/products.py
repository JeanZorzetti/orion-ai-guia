from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.product import Product
from app.models.stock_adjustment import StockAdjustment
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


# Schema for stock adjustment
class StockAdjustmentCreate(BaseModel):
    adjustment_type: str  # 'in', 'out', 'correction'
    quantity: int
    reason: str


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
    # Converter SKU vazio para None (PostgreSQL trata NULL de forma especial em UNIQUE constraints)
    product_data = product.model_dump()
    if product_data.get('sku') == '' or product_data.get('sku') is None:
        product_data['sku'] = None

    # Verifica se SKU já existe (se fornecido e não for None)
    if product_data.get('sku'):
        existing = db.query(Product).filter(
            Product.sku == product_data['sku'],
            Product.workspace_id == current_user.workspace_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU já existe neste workspace"
            )

    db_product = Product(
        **product_data,
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

    # Atualiza apenas os campos fornecidos
    update_data = product_update.model_dump(exclude_unset=True)

    # Converter SKU vazio para None
    if 'sku' in update_data and (update_data['sku'] == '' or update_data['sku'] is None):
        update_data['sku'] = None

    # Verifica SKU duplicado se estiver sendo atualizado
    if 'sku' in update_data and update_data['sku'] and update_data['sku'] != db_product.sku:
        existing = db.query(Product).filter(
            Product.sku == update_data['sku'],
            Product.workspace_id == current_user.workspace_id,
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU já existe neste workspace"
            )

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


@router.post("/{product_id}/adjust-stock", status_code=status.HTTP_200_OK)
def adjust_stock(
    product_id: int,
    adjustment: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ajusta o estoque de um produto (entrada, saída ou correção)

    Registra o ajuste no histórico e atualiza a quantidade em estoque.
    """
    # Verifica se o produto existe no workspace
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Valida tipo de ajuste
    if adjustment.adjustment_type not in ['in', 'out', 'correction']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de ajuste inválido. Use 'in', 'out' ou 'correction'"
        )

    # Valida quantidade
    if adjustment.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantidade deve ser maior que zero"
        )

    # Armazena quantidade anterior
    previous_quantity = product.stock_quantity

    # Calcula nova quantidade baseada no tipo de ajuste
    if adjustment.adjustment_type == 'in':
        new_quantity = previous_quantity + adjustment.quantity
    elif adjustment.adjustment_type == 'out':
        new_quantity = previous_quantity - adjustment.quantity
        if new_quantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estoque insuficiente. Disponível: {previous_quantity}"
            )
    else:  # correction
        new_quantity = adjustment.quantity

    # Cria registro de ajuste no histórico
    stock_adjustment = StockAdjustment(
        workspace_id=current_user.workspace_id,
        product_id=product_id,
        user_id=current_user.id,
        adjustment_type=adjustment.adjustment_type,
        quantity=adjustment.quantity,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reason=adjustment.reason
    )
    db.add(stock_adjustment)

    # Atualiza estoque do produto
    product.stock_quantity = new_quantity

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Estoque ajustado com sucesso",
        "product_id": product_id,
        "product_name": product.name,
        "adjustment_type": adjustment.adjustment_type,
        "quantity_adjusted": adjustment.quantity,
        "previous_stock": previous_quantity,
        "new_stock": new_quantity,
        "reason": adjustment.reason
    }


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


@router.options("/{product_id}/generate-fake-sales")
async def generate_fake_sales_options(product_id: int):
    """Handle CORS preflight for generate-fake-sales endpoint"""
    return {"status": "ok"}


@router.post("/{product_id}/generate-fake-sales", status_code=status.HTTP_201_CREATED)
def generate_fake_sales(
    product_id: int,
    weeks: int = Query(default=12, ge=4, le=52),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    [DEBUG/TESTE] Gera vendas fake para testar previsão de demanda

    Cria vendas sintéticas para um produto que não tem histórico suficiente.
    Útil para testar a funcionalidade de previsão sem precisar ter dados reais.

    Args:
        product_id: ID do produto
        weeks: Número de semanas de histórico fake a gerar (min: 4, max: 52)

    Returns:
        Mensagem de sucesso com quantidade de vendas criadas
    """
    from datetime import datetime, timedelta
    from app.models.sale import Sale
    import random

    # Verifica se o produto existe no workspace
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Apaga vendas fake antigas deste produto (para evitar duplicação em testes)
    db.query(Sale).filter(
        Sale.product_id == product_id,
        Sale.workspace_id == current_user.workspace_id,
        Sale.notes.like('%[FAKE DATA - TEST]%')
    ).delete()

    # Gera vendas fake
    fake_sales = []
    base_quantity = 10  # Quantidade base de vendas por semana
    trend = 0.5  # Crescimento semanal (5%)

    for week in range(weeks):
        # Data da venda (semanas atrás)
        sale_date = datetime.utcnow() - timedelta(weeks=weeks-week)

        # Quantidade com tendência crescente + variação aleatória
        quantity = int(base_quantity * (1 + trend * week / weeks) + random.randint(-3, 3))
        quantity = max(1, quantity)  # Garantir pelo menos 1

        # Preço com pequena variação
        unit_price = product.sale_price * random.uniform(0.95, 1.05)

        fake_sale = Sale(
            workspace_id=current_user.workspace_id,
            product_id=product_id,
            customer_name=f"Cliente Teste {week + 1}",
            quantity=quantity,
            unit_price=unit_price,
            total_value=quantity * unit_price,
            sale_date=sale_date,
            status="completed",
            notes=f"[FAKE DATA - TEST] Venda gerada automaticamente para teste de previsão"
        )
        fake_sales.append(fake_sale)

    # Salva no banco
    db.add_all(fake_sales)
    db.commit()

    return {
        "success": True,
        "message": f"Geradas {len(fake_sales)} vendas fake para o produto '{product.name}'",
        "product_id": product_id,
        "product_name": product.name,
        "weeks_generated": weeks,
        "total_sales": len(fake_sales),
        "date_range": {
            "start": fake_sales[0].sale_date.isoformat(),
            "end": fake_sales[-1].sale_date.isoformat()
        }
    }
