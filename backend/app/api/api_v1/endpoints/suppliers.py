from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.supplier_model import Supplier
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter()

# TODO: Fase 2 - Implementar SupplierMatcher com fuzzy matching

@router.post("/search")
async def search_suppliers(
    search_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca fornecedores
    TODO: Implementar fuzzy matching na Fase 2
    """
    supplier_name = search_data.get("supplier_name", "")

    # Mock response
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Endpoint disponível - Fuzzy matching será implementado na Fase 2",
            "results": {
                "matches": [
                    {"id": 1, "name": supplier_name, "cnpj": "00.000.000/0000-00", "confidence_score": 0.95}
                ],
                "total_found": 1
            }
        }
    )


@router.post("/create-or-merge")
async def create_or_merge_supplier(
    supplier_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria ou faz merge de fornecedor
    TODO: Implementar merge automático na Fase 2
    """
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "Endpoint disponível - Merge automático será implementado na Fase 2",
            "supplier": {
                "id": 123,
                "name": supplier_data.get("name", "Novo Fornecedor"),
                "cnpj": supplier_data.get("cnpj", ""),
                "is_new": True
            }
        }
    )


@router.get("/list")
async def list_suppliers(
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista fornecedores do workspace (com isolamento multi-tenant)
    """
    try:
        query = db.query(Supplier).filter(Supplier.workspace_id == current_user.workspace_id)

        if active_only:
            query = query.filter(Supplier.active == True)

        if search:
            query = query.filter(Supplier.name.ilike(f"%{search}%"))

        suppliers = query.offset(skip).limit(limit).all()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "suppliers": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "document": s.document,
                        "active": s.active
                    }
                    for s in suppliers
                ],
                "pagination": {
                    "total": query.count(),
                    "skip": skip,
                    "limit": limit
                }
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao listar fornecedores: {str(e)}"
        )


@router.get("/statistics")
async def get_supplier_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Estatísticas de fornecedores do workspace
    """
    try:
        total = db.query(Supplier).filter(Supplier.workspace_id == current_user.workspace_id).count()
        active = db.query(Supplier).filter(
            Supplier.workspace_id == current_user.workspace_id,
            Supplier.active == True
        ).count()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "statistics": {
                    "total_suppliers": total,
                    "active_suppliers": active,
                    "inactive_suppliers": total - active
                }
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar estatísticas: {str(e)}"
        )


@router.get("/{supplier_id}")
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Detalhes de fornecedor (com isolamento multi-tenant)
    """
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fornecedor não encontrado"
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "supplier": {
                "id": supplier.id,
                "name": supplier.name,
                "document": supplier.document,
                "email": supplier.email,
                "phone": supplier.phone,
                "address": supplier.address,
                "city": supplier.city,
                "state": supplier.state,
                "zip_code": supplier.zip_code,
                "active": supplier.active,
                "created_at": supplier.created_at.isoformat() if supplier.created_at else None
            }
        }
    )


# ===== CRUD Endpoints (RESTful) =====

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    active_only: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todos os fornecedores do workspace (multi-tenant)
    """
    query = db.query(Supplier).filter(Supplier.workspace_id == current_user.workspace_id)

    if active_only is not None:
        query = query.filter(Supplier.active == active_only)

    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))

    suppliers = query.offset(skip).limit(limit).all()
    return suppliers


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo fornecedor no workspace do usuário
    """
    db_supplier = Supplier(
        **supplier.model_dump(),
        workspace_id=current_user.workspace_id
    )
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um fornecedor existente (multi-tenant)
    """
    db_supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fornecedor não encontrado"
        )

    # Atualiza apenas os campos fornecidos
    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta um fornecedor (multi-tenant)
    """
    db_supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.workspace_id == current_user.workspace_id
    ).first()

    if not db_supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fornecedor não encontrado"
        )

    db.delete(db_supplier)
    db.commit()
    return None
