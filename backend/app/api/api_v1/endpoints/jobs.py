"""
Endpoints para executar jobs agendados manualmente.

Útil para:
- Testes de jobs em desenvolvimento
- Execução manual quando necessário
- Integração com sistemas de agendamento externos (cron, celery, etc.)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.core.deps import get_current_user
from app.models.user import User
from app.jobs.accounts_receivable_jobs import (
    update_overdue_accounts_status,
    calculate_aging_and_risk,
    run_all_ar_jobs
)

router = APIRouter()


@router.post("/ar/update-overdue-status", response_model=Dict[str, Any])
def run_update_overdue_status_job(
    current_user: User = Depends(get_current_user)
):
    """
    Executa job para atualizar status de contas vencidas.

    Atualiza automaticamente contas com status "pendente" ou "parcial"
    que já passaram da data de vencimento para status "vencido".

    **Permissão**: Apenas admin/super_admin
    """
    # Verificar permissão (apenas admin pode executar jobs)
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can execute jobs"
        )

    result = update_overdue_accounts_status()

    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/ar/calculate-aging-risk", response_model=Dict[str, Any])
def run_calculate_aging_risk_job(
    current_user: User = Depends(get_current_user)
):
    """
    Executa job para calcular aging e categorias de risco.

    Calcula dias de atraso e atualiza risk_category baseado em:
    - excelente: Em dia ou até 5 dias de atraso
    - bom: 6-15 dias
    - regular: 16-30 dias
    - ruim: 31-60 dias
    - critico: Mais de 60 dias

    **Permissão**: Apenas admin/super_admin
    """
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can execute jobs"
        )

    result = calculate_aging_and_risk()

    if not result['success']:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job failed: {result.get('error', 'Unknown error')}"
        )

    return result


@router.post("/ar/run-all", response_model=Dict[str, Any])
def run_all_ar_jobs_endpoint(
    current_user: User = Depends(get_current_user)
):
    """
    Executa TODOS os jobs de Accounts Receivable em sequência.

    Jobs executados:
    1. update_overdue_status - Atualiza status de vencidas
    2. calculate_aging_risk - Calcula dias de atraso e risco

    **Permissão**: Apenas admin/super_admin
    **Recomendação**: Executar diariamente às 00:00
    """
    if current_user.role not in ['admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can execute jobs"
        )

    result = run_all_ar_jobs()

    if not result['summary']['all_successful']:
        # Retornar 207 Multi-Status se alguns jobs falharam
        return result

    return result


@router.get("/health", response_model=Dict[str, str])
def jobs_health_check():
    """
    Health check do módulo de jobs.

    Retorna status OK se o módulo está disponível.
    """
    return {
        'status': 'healthy',
        'module': 'jobs',
        'message': 'Jobs module is ready'
    }
