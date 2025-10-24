"""
Serviço para previsão de demanda de produtos usando Machine Learning
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.sale import Sale
from app.models.product import Product

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandForecaster:
    """
    Serviço para previsão de demanda usando análise de séries temporais
    """

    def __init__(self, db: Session):
        """Inicializa o forecaster"""
        self.db = db
        self.min_data_points = 4  # Mínimo de semanas de dados

        logger.info("DemandForecaster inicializado")

    def get_demand_forecast(
        self,
        product_id: int,
        workspace_id: int,
        periods: int = 4,
        granularity: str = 'weekly'
    ) -> Dict[str, Any]:
        """
        Gera previsão de demanda para um produto

        Args:
            product_id: ID do produto
            workspace_id: ID do workspace
            periods: Número de períodos para prever
            granularity: Granularidade (daily, weekly, monthly)

        Returns:
            Dict com histórico, previsão e insights
        """

        try:
            # Valida produto
            product = self.db.query(Product).filter(
                Product.id == product_id,
                Product.workspace_id == workspace_id
            ).first()

            if not product:
                return {
                    'error': 'Produto não encontrado',
                    'success': False
                }

            # Busca histórico de vendas
            historical_data = self._get_historical_sales(product_id, workspace_id, granularity)

            if len(historical_data) < self.min_data_points:
                return {
                    'error': f'Dados insuficientes. Mínimo: {self.min_data_points} períodos',
                    'success': False,
                    'data_points': len(historical_data)
                }

            # Gera previsão
            forecast = self._predict_demand(historical_data, periods)

            # Calcula insights
            insights = self._generate_insights(
                historical_data,
                forecast,
                product
            )

            # Calcula métricas do modelo
            model_info = self._calculate_model_metrics(historical_data, forecast)

            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'current_stock': product.stock_quantity,
                    'min_stock_level': product.min_stock_level
                },
                'historical': self._format_historical_data(historical_data),
                'forecast': forecast,
                'insights': insights,
                'model_info': model_info
            }

        except Exception as e:
            logger.error(f"Erro na previsão de demanda: {e}")
            return {
                'error': str(e),
                'success': False
            }

    def _get_historical_sales(
        self,
        product_id: int,
        workspace_id: int,
        granularity: str
    ) -> pd.DataFrame:
        """Busca e agrega histórico de vendas"""

        # Define período de análise (12 meses)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        # Busca vendas completadas
        sales = self.db.query(Sale).filter(
            Sale.product_id == product_id,
            Sale.workspace_id == workspace_id,
            Sale.status == 'completed',
            Sale.sale_date >= start_date,
            Sale.sale_date <= end_date
        ).all()

        if not sales:
            return pd.DataFrame()

        # Converte para DataFrame
        data = []
        for sale in sales:
            data.append({
                'date': sale.sale_date,
                'quantity': sale.quantity
            })

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])

        # Agrega por período
        if granularity == 'daily':
            df_grouped = df.groupby(df['date'].dt.date)['quantity'].sum()
            freq = 'D'
        elif granularity == 'monthly':
            df_grouped = df.groupby(df['date'].dt.to_period('M'))['quantity'].sum()
            freq = 'M'
        else:  # weekly (padrão)
            df_grouped = df.groupby(df['date'].dt.to_period('W'))['quantity'].sum()
            freq = 'W'

        # Cria série temporal completa (preenche períodos sem vendas com 0)
        date_range = pd.date_range(start=start_date, end=end_date, freq=freq)

        result = pd.DataFrame({
            'date': date_range,
            'units_sold': 0
        })

        # Mescla com dados reais
        if granularity == 'daily':
            df_grouped.index = pd.to_datetime(df_grouped.index)
        elif granularity == 'monthly':
            df_grouped.index = df_grouped.index.to_timestamp()
        else:
            df_grouped.index = df_grouped.index.to_timestamp()

        for date, quantity in df_grouped.items():
            mask = result['date'] == date
            if mask.any():
                result.loc[mask, 'units_sold'] = quantity

        return result

    def _predict_demand(
        self,
        historical_data: pd.DataFrame,
        periods: int
    ) -> List[Dict[str, Any]]:
        """
        Gera previsão usando média móvel e tendência linear
        (Prophet seria ideal mas requer mais setup)
        """

        if len(historical_data) < self.min_data_points:
            return []

        # Calcula média móvel (últimos 4 períodos)
        window = min(4, len(historical_data))
        moving_avg = historical_data['units_sold'].rolling(window=window).mean()

        # Calcula tendência linear
        x = np.arange(len(historical_data))
        y = historical_data['units_sold'].values

        # Remove outliers para melhor ajuste
        q1 = np.percentile(y, 25)
        q3 = np.percentile(y, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        mask = (y >= lower_bound) & (y <= upper_bound)
        if mask.sum() > 2:  # Precisa de pelo menos 3 pontos
            x_clean = x[mask]
            y_clean = y[mask]
            trend = np.polyfit(x_clean, y_clean, 1)
        else:
            trend = [0, np.mean(y)]

        # Última média móvel
        last_ma = moving_avg.iloc[-1] if not pd.isna(moving_avg.iloc[-1]) else np.mean(y)

        # Gera previsões
        forecast = []
        last_date = historical_data['date'].iloc[-1]

        for i in range(1, periods + 1):
            # Previsão = média móvel + tendência
            predicted_value = last_ma + (trend[0] * i)

            # Não permite valores negativos
            predicted_value = max(0, predicted_value)

            # Calcula intervalos de confiança (±20%)
            std_dev = historical_data['units_sold'].std()
            confidence_interval = std_dev * 0.5

            lower_bound = max(0, predicted_value - confidence_interval)
            upper_bound = predicted_value + confidence_interval

            # Próxima data
            next_date = last_date + timedelta(weeks=i)

            # Confiança diminui com o tempo
            confidence = max(0.5, 0.9 - (i * 0.1))

            forecast.append({
                'period': f"{next_date.year}-W{next_date.isocalendar()[1]:02d}",
                'predicted_units': round(predicted_value, 2),
                'lower_bound': round(lower_bound, 2),
                'upper_bound': round(upper_bound, 2),
                'confidence': round(confidence, 2),
                'date_start': next_date.strftime('%Y-%m-%d')
            })

        return forecast

    def _generate_insights(
        self,
        historical_data: pd.DataFrame,
        forecast: List[Dict[str, Any]],
        product: Product
    ) -> Dict[str, Any]:
        """Gera insights acionáveis"""

        units_sold = historical_data['units_sold'].values

        # Calcula tendência
        recent_avg = np.mean(units_sold[-4:]) if len(units_sold) >= 4 else np.mean(units_sold)
        older_avg = np.mean(units_sold[:-4]) if len(units_sold) > 4 else recent_avg

        trend_percentage = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0

        if trend_percentage > 10:
            trend = 'increasing'
        elif trend_percentage < -10:
            trend = 'decreasing'
        else:
            trend = 'stable'

        # Média semanal
        avg_weekly_demand = round(np.mean(units_sold), 2)

        # Previsão total
        total_forecast = sum(f['predicted_units'] for f in forecast)

        # Estoque recomendado (média + 1 desvio padrão)
        std_dev = np.std(units_sold)
        recommended_stock = round(avg_weekly_demand * 4 + std_dev * 2, 0)

        # Ponto de reordenamento
        reorder_point = round(avg_weekly_demand * 2, 0)

        # Cobertura de estoque
        stock_coverage_weeks = (product.stock_quantity / avg_weekly_demand) if avg_weekly_demand > 0 else 0

        # Gera alertas
        alerts = []

        if stock_coverage_weeks < 2:
            alerts.append({
                'type': 'warning',
                'severity': 'high',
                'message': f'Estoque atual cobrirá apenas {stock_coverage_weeks:.1f} semanas da demanda prevista',
                'action': 'Considere fazer um pedido de reposição urgente'
            })
        elif stock_coverage_weeks < 4:
            alerts.append({
                'type': 'warning',
                'severity': 'medium',
                'message': f'Estoque atual cobrirá {stock_coverage_weeks:.1f} semanas da demanda prevista',
                'action': 'Planeje reposição nas próximas semanas'
            })

        if trend == 'increasing':
            alerts.append({
                'type': 'info',
                'severity': 'low',
                'message': f'Demanda em crescimento (+{trend_percentage:.1f}%)',
                'action': 'Considere aumentar níveis de estoque'
            })
        elif trend == 'decreasing':
            alerts.append({
                'type': 'info',
                'severity': 'low',
                'message': f'Demanda em queda ({trend_percentage:.1f}%)',
                'action': 'Revise planejamento de compras'
            })

        if product.stock_quantity < product.min_stock_level:
            alerts.append({
                'type': 'warning',
                'severity': 'high',
                'message': f'Estoque abaixo do mínimo ({product.stock_quantity} < {product.min_stock_level})',
                'action': 'Reposição necessária imediatamente'
            })

        return {
            'trend': trend,
            'trend_percentage': round(trend_percentage, 1),
            'seasonality_detected': False,  # Requer análise mais complexa
            'avg_weekly_demand': avg_weekly_demand,
            'recommended_stock_level': int(recommended_stock),
            'reorder_point': int(reorder_point),
            'stock_coverage_weeks': round(stock_coverage_weeks, 1),
            'total_forecast_4weeks': round(total_forecast, 0),
            'alerts': alerts
        }

    def _format_historical_data(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Formata dados históricos para resposta"""

        result = []
        for _, row in df.iterrows():
            date = row['date']
            result.append({
                'period': f"{date.year}-W{date.isocalendar()[1]:02d}",
                'units_sold': int(row['units_sold']),
                'date_start': date.strftime('%Y-%m-%d')
            })

        return result

    def _calculate_model_metrics(
        self,
        historical_data: pd.DataFrame,
        forecast: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calcula métricas do modelo"""

        # MAPE simplificado (estimativa baseada em variância)
        units_sold = historical_data['units_sold'].values
        mean_demand = np.mean(units_sold)
        std_demand = np.std(units_sold)

        # Estimativa de MAPE baseada em coeficiente de variação
        cv = (std_demand / mean_demand * 100) if mean_demand > 0 else 50
        estimated_mape = min(cv, 50)  # Cap em 50%

        # RMSE estimado
        estimated_rmse = round(std_demand, 1)

        return {
            'model_used': 'moving_average_with_trend',
            'data_points': len(historical_data),
            'training_period': f"{historical_data['date'].iloc[0].strftime('%Y-%m-%d')} to {historical_data['date'].iloc[-1].strftime('%Y-%m-%d')}",
            'mape': round(estimated_mape, 1),
            'rmse': estimated_rmse,
            'last_updated': datetime.now().isoformat()
        }
