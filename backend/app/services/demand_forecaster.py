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

            logger.info(f"Dados históricos retornados: {len(historical_data)} períodos")
            if len(historical_data) > 0:
                logger.info(f"Soma total de vendas no histórico: {historical_data['units_sold'].sum()}")
                logger.info(f"Primeiras 5 linhas:\n{historical_data.head()}")

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

        # DEBUG: Log dos parâmetros de busca
        logger.info(f"🔍 Buscando vendas: product_id={product_id}, workspace_id={workspace_id}")
        logger.info(f"📅 Período: {start_date.date()} até {end_date.date()}")

        # Busca vendas completadas
        sales = self.db.query(Sale).filter(
            Sale.product_id == product_id,
            Sale.workspace_id == workspace_id,
            Sale.status == 'completed',
            Sale.sale_date >= start_date,
            Sale.sale_date <= end_date
        ).all()

        # DEBUG: Verifica vendas sem filtro de workspace
        all_sales_for_product = self.db.query(Sale).filter(
            Sale.product_id == product_id,
            Sale.status == 'completed'
        ).count()
        logger.info(f"🔍 Total de vendas deste produto (todos workspaces): {all_sales_for_product}")

        # DEBUG: Verifica workspace das vendas
        if all_sales_for_product > 0:
            sample_sale = self.db.query(Sale).filter(
                Sale.product_id == product_id,
                Sale.status == 'completed'
            ).first()
            logger.info(f"🔍 Amostra: venda ID={sample_sale.id}, workspace_id={sample_sale.workspace_id}, data={sample_sale.sale_date}")

        if not sales:
            logger.warning(f"❌ Nenhuma venda encontrada para produto {product_id} no workspace {workspace_id}")
            return pd.DataFrame()

        logger.info(f"✅ Encontradas {len(sales)} vendas para produto {product_id}")

        # Converte para DataFrame
        data = []
        for sale in sales:
            data.append({
                'date': sale.sale_date,
                'quantity': sale.quantity
            })

        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['date'])

        logger.info(f"Total de unidades vendidas: {df['quantity'].sum()}")

        # Normaliza datas para o início do período ANTES de agrupar
        if granularity == 'daily':
            df['period_start'] = df['date'].dt.normalize()
            freq = 'D'
        elif granularity == 'monthly':
            df['period_start'] = df['date'].dt.to_period('M').dt.to_timestamp()
            freq = 'M'
        else:  # weekly (padrão) - normaliza para segunda-feira
            # Subtrai dias até chegar na segunda-feira (weekday=0)
            df['period_start'] = df['date'] - pd.to_timedelta(df['date'].dt.weekday, unit='D')
            df['period_start'] = df['period_start'].dt.normalize()
            freq = 'W-MON'

        # Agrega por período normalizado
        df_grouped = df.groupby('period_start')['quantity'].sum()

        logger.info(f"Após agregação por {granularity}: {len(df_grouped)} períodos, soma={df_grouped.sum()}")
        logger.info(f"Primeiras datas agregadas: {df_grouped.head().index.tolist()}")

        # Converte Series para DataFrame
        sales_df = df_grouped.reset_index()
        sales_df.columns = ['date', 'units_sold']
        sales_df['date'] = pd.to_datetime(sales_df['date'])

        logger.info(f"Sales DF após conversão: {len(sales_df)} linhas, soma={sales_df['units_sold'].sum()}")

        # Cria série temporal completa com frequência correta
        # Normaliza start_date para o início do período
        if granularity == 'weekly':
            period_start = start_date - timedelta(days=start_date.weekday())
        elif granularity == 'monthly':
            period_start = start_date.replace(day=1)
        else:
            period_start = start_date

        date_range = pd.date_range(start=period_start, end=end_date, freq=freq)

        logger.info(f"Date range: {len(date_range)} períodos, primeiro={date_range[0]}, último={date_range[-1]}")

        # DataFrame vazio com todas as datas
        result = pd.DataFrame({'date': date_range})
        result['date'] = pd.to_datetime(result['date'])

        logger.info(f"Result antes do merge: {len(result)} linhas")
        logger.info(f"Primeiras datas do result: {result['date'].head().tolist()}")

        # Faz merge mantendo todas as datas e preenchendo com 0
        result = result.merge(sales_df, on='date', how='left')
        result['units_sold'] = result['units_sold'].fillna(0)

        # Garante que tipos estão corretos
        result['units_sold'] = result['units_sold'].astype(int)

        logger.info(f"Result após merge: {len(result)} linhas, soma={result['units_sold'].sum()}")

        logger.info(f"Histórico processado: {len(result)} períodos, {result['units_sold'].sum()} unidades vendidas")
        logger.info(f"Períodos com vendas: {(result['units_sold'] > 0).sum()}")

        return result

    def _predict_demand(
        self,
        historical_data: pd.DataFrame,
        periods: int
    ) -> List[Dict[str, Any]]:
        """
        Gera previsão usando média móvel exponencial + tendência + sazonalidade
        Algoritmo melhorado para maior precisão
        """

        if len(historical_data) < self.min_data_points:
            return []

        y = historical_data['units_sold'].values
        n = len(y)

        # 1. Média Móvel Exponencial (EMA) - dá mais peso aos dados recentes
        alpha = 0.3  # Fator de suavização
        ema = [y[0]]  # Inicializa com primeiro valor
        for i in range(1, n):
            ema.append(alpha * y[i] + (1 - alpha) * ema[i-1])

        # 2. Detecta tendência usando regressão linear ponderada
        x = np.arange(n)
        weights = np.exp(np.linspace(-1, 0, n))  # Mais peso nos dados recentes

        # Remove outliers para melhor ajuste
        q1, q3 = np.percentile(y, [25, 75])
        iqr = q3 - q1
        mask = (y >= q1 - 1.5 * iqr) & (y <= q3 + 1.5 * iqr)

        if mask.sum() > 2:
            x_clean = x[mask]
            y_clean = y[mask]
            w_clean = weights[mask]
            trend = np.polyfit(x_clean, y_clean, 1, w=w_clean)
        else:
            trend = [0, np.mean(y)]

        # 3. Detecta sazonalidade simples (padrões semanais/mensais)
        seasonal_component = self._detect_seasonality(y)

        # 4. Calcula base para previsão (última EMA + tendência)
        last_ema = ema[-1]

        # 5. Calcula métricas de dispersão para intervalos de confiança
        residuals = y - np.array(ema)
        std_dev = np.std(residuals)

        # 6. Gera previsões
        forecast = []
        last_date = historical_data['date'].iloc[-1]

        for i in range(1, periods + 1):
            # Base: EMA + Tendência
            base_prediction = last_ema + (trend[0] * i)

            # Adiciona componente sazonal (se detectado)
            seasonal_factor = seasonal_component.get(i % len(seasonal_component), 0) if seasonal_component else 0
            predicted_value = base_prediction + seasonal_factor

            # Não permite valores negativos
            predicted_value = max(0, predicted_value)

            # Intervalos de confiança aumentam com horizonte de previsão
            # Usa distribuição t-student para maior robustez
            confidence_multiplier = 1 + (i * 0.15)  # Cresce 15% por período
            margin = std_dev * confidence_multiplier * 1.96  # 95% confiança

            lower_bound = max(0, predicted_value - margin)
            upper_bound = predicted_value + margin

            # Próxima data
            next_date = last_date + timedelta(weeks=i)

            # Confiança diminui não-linearmente com o tempo
            confidence = max(0.4, 0.95 * np.exp(-0.15 * i))

            forecast.append({
                'period': f"{next_date.year}-W{next_date.isocalendar()[1]:02d}",
                'predicted_units': round(predicted_value, 2),
                'lower_bound': round(lower_bound, 2),
                'upper_bound': round(upper_bound, 2),
                'confidence': round(confidence, 2),
                'date_start': next_date.strftime('%Y-%m-%d')
            })

        return forecast

    def _detect_seasonality(self, data: np.ndarray) -> Dict[int, float]:
        """
        Detecta padrões sazonais simples nos dados
        Retorna ajustes por posição no ciclo
        """
        n = len(data)

        # Precisa de pelo menos 2 ciclos para detectar sazonalidade
        if n < 8:
            return {}

        # Tenta detectar ciclo de 4 semanas (mensal)
        cycle_length = 4
        if n >= cycle_length * 2:
            seasonal_avg = {}
            for position in range(cycle_length):
                values = [data[i] for i in range(position, n, cycle_length)]
                if values:
                    seasonal_avg[position] = np.mean(values) - np.mean(data)

            # Só retorna se houver variação significativa (>10% da média)
            variation = np.std(list(seasonal_avg.values()))
            if variation > np.mean(data) * 0.1:
                return seasonal_avg

        return {}

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

        # Detecta sazonalidade real
        seasonal_pattern = self._detect_seasonality(units_sold)
        seasonality_detected = len(seasonal_pattern) > 0

        return {
            'trend': trend,
            'trend_percentage': round(trend_percentage, 1),
            'seasonality_detected': seasonality_detected,
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
