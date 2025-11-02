from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.core.database import get_db
from app.models.sales_pipeline import (
    SalesPipeline, PipelineStage, Opportunity,
    OpportunityStatus, OpportunitySource, OpportunityPriority
)
from app.models.customer import Customer
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


# ============================================
# SALES PIPELINE
# ============================================

@router.get("/pipelines")
def list_pipelines(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista pipelines de vendas
    """
    query = db.query(SalesPipeline).filter(
        SalesPipeline.workspace_id == current_user.workspace_id
    )

    if is_active is not None:
        query = query.filter(SalesPipeline.is_active == is_active)

    query = query.order_by(SalesPipeline.is_default.desc(), SalesPipeline.name)

    pipelines = query.offset(skip).limit(limit).all()

    result = []
    for pipeline in pipelines:
        # Buscar estágios
        stages = db.query(PipelineStage).filter(
            PipelineStage.pipeline_id == pipeline.id
        ).order_by(PipelineStage.order).all()

        # Calcular estatísticas de cada estágio
        stages_data = []
        for stage in stages:
            opps_count = db.query(func.count(Opportunity.id)).filter(
                Opportunity.stage_id == stage.id,
                Opportunity.status == OpportunityStatus.OPEN
            ).scalar() or 0

            total_value = db.query(func.sum(Opportunity.value)).filter(
                Opportunity.stage_id == stage.id,
                Opportunity.status == OpportunityStatus.OPEN
            ).scalar() or 0.0

            stages_data.append({
                "id": stage.id,
                "pipeline_id": stage.pipeline_id,
                "name": stage.name,
                "order": stage.order,
                "color": stage.color,
                "win_probability": stage.win_probability,
                "auto_actions": stage.auto_actions,
                "max_days_in_stage": stage.max_days_in_stage,
                "alert_before_sla": stage.alert_before_sla,
                "opportunities_count": opps_count,
                "total_value": float(total_value)
            })

        result.append({
            "id": pipeline.id,
            "name": pipeline.name,
            "description": pipeline.description,
            "workspace_id": pipeline.workspace_id,
            "is_default": pipeline.is_default,
            "is_active": pipeline.is_active,
            "stages": stages_data,
            "created_at": pipeline.created_at.isoformat(),
            "updated_at": pipeline.updated_at.isoformat()
        })

    return result


@router.get("/pipelines/default")
def get_default_pipeline(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna o pipeline padrão
    """
    pipeline = db.query(SalesPipeline).filter(
        SalesPipeline.workspace_id == current_user.workspace_id,
        SalesPipeline.is_default == True,
        SalesPipeline.is_active == True
    ).first()

    if not pipeline:
        # Se não houver pipeline padrão, retornar o primeiro ativo
        pipeline = db.query(SalesPipeline).filter(
            SalesPipeline.workspace_id == current_user.workspace_id,
            SalesPipeline.is_active == True
        ).first()

    if not pipeline:
        return None

    # Buscar estágios
    stages = db.query(PipelineStage).filter(
        PipelineStage.pipeline_id == pipeline.id
    ).order_by(PipelineStage.order).all()

    # Calcular estatísticas de cada estágio
    stages_data = []
    for stage in stages:
        opps_count = db.query(func.count(Opportunity.id)).filter(
            Opportunity.stage_id == stage.id,
            Opportunity.status == OpportunityStatus.OPEN
        ).scalar() or 0

        total_value = db.query(func.sum(Opportunity.value)).filter(
            Opportunity.stage_id == stage.id,
            Opportunity.status == OpportunityStatus.OPEN
        ).scalar() or 0.0

        stages_data.append({
            "id": stage.id,
            "pipeline_id": stage.pipeline_id,
            "name": stage.name,
            "order": stage.order,
            "color": stage.color,
            "win_probability": stage.win_probability,
            "auto_actions": stage.auto_actions,
            "max_days_in_stage": stage.max_days_in_stage,
            "alert_before_sla": stage.alert_before_sla,
            "opportunities_count": opps_count,
            "total_value": float(total_value)
        })

    return {
        "id": pipeline.id,
        "name": pipeline.name,
        "description": pipeline.description,
        "workspace_id": pipeline.workspace_id,
        "is_default": pipeline.is_default,
        "is_active": pipeline.is_active,
        "stages": stages_data,
        "created_at": pipeline.created_at.isoformat(),
        "updated_at": pipeline.updated_at.isoformat()
    }


# ============================================
# OPPORTUNITIES
# ============================================

@router.get("/opportunities")
def list_opportunities(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=5000),
    pipeline_id: Optional[int] = Query(None),
    stage_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista oportunidades
    """
    query = db.query(Opportunity, PipelineStage, Customer).outerjoin(
        PipelineStage, Opportunity.stage_id == PipelineStage.id
    ).outerjoin(
        Customer, Opportunity.customer_id == Customer.id
    ).filter(
        Opportunity.workspace_id == current_user.workspace_id
    )

    if pipeline_id:
        query = query.filter(Opportunity.pipeline_id == pipeline_id)

    if stage_id:
        query = query.filter(Opportunity.stage_id == stage_id)

    if status:
        query = query.filter(Opportunity.status == status)

    if assigned_to:
        query = query.filter(Opportunity.assigned_to == assigned_to)

    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(or_(
            Opportunity.title.ilike(search_lower),
            Opportunity.description.ilike(search_lower),
            Opportunity.contact_name.ilike(search_lower),
            Opportunity.company_name.ilike(search_lower),
            Customer.name.ilike(search_lower)
        ))

    query = query.order_by(Opportunity.created_at.desc())

    results = query.offset(skip).limit(limit).all()

    opportunities = []
    for opp, stage, customer in results:
        # Calcular dias no estágio
        days_in_stage = 0
        if opp.stage_entered_at:
            days_in_stage = (datetime.utcnow() - opp.stage_entered_at).days

        opportunities.append({
            "id": opp.id,
            "pipeline_id": opp.pipeline_id,
            "stage_id": opp.stage_id,
            "stage_name": stage.name if stage else None,
            "customer_id": opp.customer_id,
            "customer_name": customer.name if customer else None,
            "assigned_to": opp.assigned_to,
            "title": opp.title,
            "description": opp.description,
            "value": opp.value,
            "status": opp.status.value,
            "source": opp.source.value if opp.source else None,
            "priority": opp.priority.value,
            "expected_close_date": opp.expected_close_date.isoformat() if opp.expected_close_date else None,
            "closed_date": opp.closed_date.isoformat() if opp.closed_date else None,
            "won_date": opp.won_date.isoformat() if opp.won_date else None,
            "lost_date": opp.lost_date.isoformat() if opp.lost_date else None,
            "lost_reason": opp.lost_reason,
            "contact_name": opp.contact_name,
            "contact_email": opp.contact_email,
            "contact_phone": opp.contact_phone,
            "company_name": opp.company_name,
            "custom_fields": opp.custom_fields,
            "stage_entered_at": opp.stage_entered_at.isoformat() if opp.stage_entered_at else None,
            "days_in_stage": days_in_stage,
            "sla_overdue": opp.sla_overdue,
            "created_at": opp.created_at.isoformat(),
            "updated_at": opp.updated_at.isoformat()
        })

    return opportunities


@router.get("/opportunities/stats")
def get_opportunities_stats(
    pipeline_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de oportunidades
    """
    query = db.query(Opportunity).filter(
        Opportunity.workspace_id == current_user.workspace_id
    )

    if pipeline_id:
        query = query.filter(Opportunity.pipeline_id == pipeline_id)

    # Total de oportunidades abertas
    open_count = query.filter(Opportunity.status == OpportunityStatus.OPEN).count()

    # Valor total do pipeline
    total_value = query.filter(Opportunity.status == OpportunityStatus.OPEN).with_entities(
        func.sum(Opportunity.value)
    ).scalar() or 0.0

    # Valor ponderado (soma de valor * probabilidade do estágio)
    weighted_query = db.query(
        func.sum(Opportunity.value * PipelineStage.win_probability / 100.0)
    ).join(
        PipelineStage, Opportunity.stage_id == PipelineStage.id
    ).filter(
        Opportunity.workspace_id == current_user.workspace_id,
        Opportunity.status == OpportunityStatus.OPEN
    )

    if pipeline_id:
        weighted_query = weighted_query.filter(Opportunity.pipeline_id == pipeline_id)

    weighted_value = weighted_query.scalar() or 0.0

    # Taxa de conversão (últimos 30 dias)
    last_30_days = datetime.utcnow() - timedelta(days=30)
    closed_query = query.filter(Opportunity.closed_date >= last_30_days)

    total_closed = closed_query.count()
    won_count = closed_query.filter(Opportunity.status == OpportunityStatus.WON).count()

    conversion_rate = (won_count / total_closed * 100) if total_closed > 0 else 0.0

    # Valor ganho (últimos 30 dias)
    won_value = query.filter(
        Opportunity.status == OpportunityStatus.WON,
        Opportunity.won_date >= last_30_days
    ).with_entities(func.sum(Opportunity.value)).scalar() or 0.0

    return {
        "open_opportunities": open_count,
        "total_value": float(total_value),
        "weighted_value": float(weighted_value),
        "conversion_rate": float(conversion_rate),
        "won_last_30_days": won_count,
        "won_value_last_30_days": float(won_value)
    }


@router.get("/analytics")
def get_pipeline_analytics(
    pipeline_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna analytics do pipeline
    """
    query = db.query(Opportunity).filter(
        Opportunity.workspace_id == current_user.workspace_id
    )

    if pipeline_id:
        query = query.filter(Opportunity.pipeline_id == pipeline_id)

    # Conversão por fonte
    source_stats = db.query(
        Opportunity.source,
        func.count(Opportunity.id).label('total'),
        func.sum(func.cast(Opportunity.status == OpportunityStatus.WON, Integer)).label('won')
    ).filter(
        Opportunity.workspace_id == current_user.workspace_id
    ).group_by(Opportunity.source).all()

    conversion_by_source = []
    for source, total, won in source_stats:
        conversion_rate = (won / total * 100) if total > 0 else 0
        conversion_by_source.append({
            "source": source.value if source else "unknown",
            "total": total,
            "won": won or 0,
            "conversion_rate": float(conversion_rate)
        })

    # Tempo médio por estágio (aproximado)
    avg_time_by_stage = []
    stages = db.query(PipelineStage).join(SalesPipeline).filter(
        SalesPipeline.workspace_id == current_user.workspace_id
    )

    if pipeline_id:
        stages = stages.filter(PipelineStage.pipeline_id == pipeline_id)

    for stage in stages.all():
        # Tempo médio aproximado (baseado em dias_in_stage)
        avg_days = db.query(func.avg(Opportunity.days_in_stage)).filter(
            Opportunity.stage_id == stage.id,
            Opportunity.days_in_stage.isnot(None)
        ).scalar() or 0

        avg_time_by_stage.append({
            "stage": stage.name,
            "avg_days": float(avg_days)
        })

    return {
        "conversion_by_source": conversion_by_source,
        "avg_time_by_stage": avg_time_by_stage
    }
