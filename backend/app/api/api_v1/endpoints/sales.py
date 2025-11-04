from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.core.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleUpdate, SaleResponse

router = APIRouter()


@router.get("/", response_model=List[SaleResponse])
def get_sales(
    skip: int = 0,
    limit: int = 50000,  # Limite aumentado para suportar dados de debug/seed
    status_filter: Optional[str] = None,
    product_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas as vendas do workspace (multi-tenant)
    """
    query = db.query(Sale).filter(Sale.workspace_id == current_user.workspace_id)

    if status_filter:
        query = query.filter(Sale.status == status_filter)

    if product_id:
        query = query.filter(Sale.product_id == product_id)

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)

    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    sales = query.order_by(Sale.sale_date.desc()).offset(skip).limit(limit).all()
    return sales


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de uma venda específica (multi-tenant)
    """
    sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.workspace_id == current_user.workspace_id
    ).first()

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venda não encontrada"
        )

    return sale


@router.post("/", response_model=SaleResponse, status_code=status.HTTP_201_CREATED)
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova venda no workspace do usuário
    """
    # Verifica se o produto existe no workspace
    product = db.query(Product).filter(
        Product.id == sale.product_id,
        Product.workspace_id == current_user.workspace_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado neste workspace"
        )

    # Verifica se há estoque suficiente
    if product.stock_quantity < sale.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estoque insuficiente. Disponível: {product.stock_quantity}"
        )

    # Cria a venda
    db_sale = Sale(
        **sale.model_dump(),
        workspace_id=current_user.workspace_id,
        status="pending"
    )
    db.add(db_sale)

    # Atualiza o estoque do produto
    product.stock_quantity -= sale.quantity

    db.commit()
    db.refresh(db_sale)
    return db_sale


@router.patch("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    sale_update: SaleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza uma venda existente (multi-tenant)
    """
    db_sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.workspace_id == current_user.workspace_id
    ).first()

    if not db_sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venda não encontrada"
        )

    # Se está mudando a quantidade, ajusta o estoque
    if sale_update.quantity and sale_update.quantity != db_sale.quantity:
        product = db.query(Product).filter(Product.id == db_sale.product_id).first()
        if product:
            # Devolve a quantidade antiga ao estoque
            product.stock_quantity += db_sale.quantity
            # Remove a nova quantidade
            if product.stock_quantity < sale_update.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente. Disponível: {product.stock_quantity}"
                )
            product.stock_quantity -= sale_update.quantity

    # Atualiza apenas os campos fornecidos
    update_data = sale_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_sale, field, value)

    db.commit()
    db.refresh(db_sale)
    return db_sale


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta uma venda (multi-tenant)
    Devolve a quantidade ao estoque do produto
    """
    db_sale = db.query(Sale).filter(
        Sale.id == sale_id,
        Sale.workspace_id == current_user.workspace_id
    ).first()

    if not db_sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venda não encontrada"
        )

    # Devolve a quantidade ao estoque
    product = db.query(Product).filter(Product.id == db_sale.product_id).first()
    if product:
        product.stock_quantity += db_sale.quantity

    db.delete(db_sale)
    db.commit()
    return None
