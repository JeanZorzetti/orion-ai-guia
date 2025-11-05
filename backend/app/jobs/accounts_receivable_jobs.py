"""
Jobs agendados para Accounts Receivable (Contas a Receber).

Automatiza tarefas como:
- Atualização de status de contas vencidas
- Cálculo de aging
- Envio de lembretes
"""

from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Dict, Any
import logging

from app.core.database import SessionLocal
from app.models.accounts_receivable import AccountsReceivable

logger = logging.getLogger(__name__)


def update_overdue_accounts_status() -> Dict[str, Any]:
    """
    Atualiza automaticamente o status de contas vencidas.

    Lógica:
    - Busca todas as contas com status "pendente" ou "parcial"
    - Verifica se due_date < hoje
    - Atualiza status para "vencido"

    Returns:
        Dict com estatísticas da atualização
    """
    db: Session = SessionLocal()
    try:
        today = date.today()

        # Buscar contas vencidas que ainda não têm status "vencido"
        overdue_accounts = db.query(AccountsReceivable).filter(
            AccountsReceivable.due_date < today,
            AccountsReceivable.status.in_(['pendente', 'parcial'])
        ).all()

        updated_count = 0
        updated_ids = []

        for account in overdue_accounts:
            days_overdue = (today - account.due_date).days

            # Atualizar status para vencido
            account.status = 'vencido'
            account.updated_at = datetime.utcnow()

            # Log para auditoria
            logger.info(
                f"Conta {account.id} marcada como vencida. "
                f"Dias em atraso: {days_overdue}. "
                f"Cliente: {account.customer_name}"
            )

            updated_count += 1
            updated_ids.append(account.id)

        # Commit das mudanças
        db.commit()

        result = {
            'success': True,
            'updated_count': updated_count,
            'updated_ids': updated_ids,
            'execution_date': today.isoformat(),
            'message': f'Atualizadas {updated_count} contas para status "vencido"'
        }

        logger.info(f"Job update_overdue_accounts_status concluído: {result['message']}")
        return result

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar contas vencidas: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'updated_count': 0,
            'execution_date': date.today().isoformat()
        }
    finally:
        db.close()


def calculate_aging_and_risk() -> Dict[str, Any]:
    """
    Calcula o aging (dias em atraso) e atualiza a categoria de risco.

    Categorias de risco baseadas em dias de atraso:
    - excelente: Em dia ou até 5 dias de atraso
    - bom: 6-15 dias
    - regular: 16-30 dias
    - ruim: 31-60 dias
    - critico: Mais de 60 dias

    Returns:
        Dict com estatísticas do cálculo
    """
    db: Session = SessionLocal()
    try:
        today = date.today()

        # Buscar todas as contas não recebidas e não canceladas
        active_accounts = db.query(AccountsReceivable).filter(
            AccountsReceivable.status.in_(['pendente', 'parcial', 'vencido'])
        ).all()

        updated_count = 0
        risk_distribution = {
            'excelente': 0,
            'bom': 0,
            'regular': 0,
            'ruim': 0,
            'critico': 0
        }

        for account in active_accounts:
            days_diff = (today - account.due_date).days

            # Determinar categoria de risco
            if days_diff <= 5:
                new_risk = 'excelente'
            elif days_diff <= 15:
                new_risk = 'bom'
            elif days_diff <= 30:
                new_risk = 'regular'
            elif days_diff <= 60:
                new_risk = 'ruim'
            else:
                new_risk = 'critico'

            # Atualizar apenas se mudou
            if account.risk_category != new_risk:
                account.risk_category = new_risk
                account.updated_at = datetime.utcnow()
                updated_count += 1

            risk_distribution[new_risk] += 1

        db.commit()

        result = {
            'success': True,
            'updated_count': updated_count,
            'total_accounts': len(active_accounts),
            'risk_distribution': risk_distribution,
            'execution_date': today.isoformat(),
            'message': f'Calculado risco para {len(active_accounts)} contas, {updated_count} atualizadas'
        }

        logger.info(f"Job calculate_aging_and_risk concluído: {result['message']}")
        return result

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao calcular aging e risco: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'updated_count': 0,
            'execution_date': date.today().isoformat()
        }
    finally:
        db.close()


def run_all_ar_jobs() -> Dict[str, Any]:
    """
    Executa todos os jobs de Accounts Receivable em sequência.

    Returns:
        Dict com resultados de todos os jobs
    """
    logger.info("Iniciando execução de todos os jobs de AR")

    results = {
        'execution_time': datetime.utcnow().isoformat(),
        'jobs': {}
    }

    # Job 1: Atualizar status de vencidas
    logger.info("Executando job: update_overdue_accounts_status")
    results['jobs']['update_overdue_status'] = update_overdue_accounts_status()

    # Job 2: Calcular aging e risco
    logger.info("Executando job: calculate_aging_and_risk")
    results['jobs']['calculate_aging_risk'] = calculate_aging_and_risk()

    # Resumo geral
    total_updates = sum(
        job_result.get('updated_count', 0)
        for job_result in results['jobs'].values()
    )

    results['summary'] = {
        'total_jobs': len(results['jobs']),
        'total_updates': total_updates,
        'all_successful': all(
            job_result.get('success', False)
            for job_result in results['jobs'].values()
        )
    }

    logger.info(f"Todos os jobs AR concluídos. Total de atualizações: {total_updates}")
    return results
