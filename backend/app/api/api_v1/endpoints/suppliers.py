from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.supplier import Supplier
from app.services.supplier_matcher import SupplierMatcher
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/search")
async def search_suppliers(
    search_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Busca fornecedores usando fuzzy matching

    - **supplier_name**: Nome do fornecedor para buscar
    - **supplier_cnpj**: CNPJ do fornecedor (opcional)
    - **limit**: Número máximo de sugestões (padrão: 5)
    """

    try:
        supplier_name = search_data.get("supplier_name", "")
        supplier_cnpj = search_data.get("supplier_cnpj", "")
        limit = search_data.get("limit", 5)

        if not supplier_name and not supplier_cnpj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Forneça pelo menos o nome ou CNPJ do fornecedor"
            )

        # Inicializa o matcher
        supplier_matcher = SupplierMatcher(db)

        # Busca correspondências
        matches = supplier_matcher.find_matching_suppliers(
            supplier_name=supplier_name,
            supplier_cnpj=supplier_cnpj,
            limit=limit
        )

        # Verifica sugestão de merge
        merge_suggestion = supplier_matcher.suggest_supplier_merge(supplier_name, supplier_cnpj)

        # Obter estatísticas
        stats = supplier_matcher.get_supplier_statistics()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "message": f"Busca realizada com sucesso",
                "search_params": {
                    "supplier_name": supplier_name,
                    "supplier_cnpj": supplier_cnpj,
                    "limit": limit
                },
                "results": {
                    "matches": matches,
                    "total_found": len(matches),
                    "best_match": matches[0] if matches else None,
                    "merge_suggestion": merge_suggestion
                },
                "statistics": stats,
                "processed_at": datetime.now().isoformat()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro na busca de fornecedores: {str(e)}"
        )

@router.post("/create-or-merge")
async def create_or_merge_supplier(
    supplier_data: Dict[str, Any],
    auto_merge: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria novo fornecedor ou faz merge com existente

    - **supplier_data**: Dados do fornecedor
    - **auto_merge**: Se deve fazer merge automático para correspondências altas
    """

    try:
        # Inicializa o matcher
        supplier_matcher = SupplierMatcher(db)

        # Tenta criar ou fazer merge
        supplier, is_new, matching_info = supplier_matcher.create_or_get_supplier(
            supplier_data=supplier_data,
            auto_merge=auto_merge
        )

        return JSONResponse(
            status_code=status.HTTP_201_CREATED if is_new else status.HTTP_200_OK,
            content={
                "success": True,
                "message": "Fornecedor criado com sucesso" if is_new else "Fornecedor existente encontrado",
                "supplier": supplier.to_dict(),
                "is_new": is_new,
                "matching_info": matching_info,
                "processed_at": datetime.now().isoformat()
            }
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar/merge fornecedor: {str(e)}"
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
    Lista fornecedores com filtros opcionais
    """

    try:
        query = db.query(Supplier)

        # Filtro por status ativo
        if active_only:
            query = query.filter(Supplier.is_active == True)

        # Filtro de busca
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Supplier.name.ilike(search_term)) |
                (Supplier.cnpj.ilike(search_term))
            )

        # Paginação
        suppliers = query.offset(skip).limit(limit).all()
        total = query.count()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "suppliers": [supplier.to_summary() for supplier in suppliers],
                "pagination": {
                    "total": total,
                    "skip": skip,
                    "limit": limit,
                    "has_more": skip + limit < total
                },
                "filters": {
                    "active_only": active_only,
                    "search": search
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
    Obter estatísticas dos fornecedores
    """

    try:
        supplier_matcher = SupplierMatcher(db)
        stats = supplier_matcher.get_supplier_statistics()

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "statistics": stats,
                "generated_at": datetime.now().isoformat()
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )

@router.get("/{supplier_id}")
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obter detalhes de um fornecedor específico
    """

    try:
        supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()

        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fornecedor com ID {supplier_id} não encontrado"
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "success": True,
                "supplier": supplier.to_dict()
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter fornecedor: {str(e)}"
        )