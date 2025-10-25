import { useState, useEffect } from 'react';
import { productService } from '@/services/product';
import { DemandForecastResponse } from '@/types';

interface UseDemandForecastOptions {
  period?: '2_weeks' | '4_weeks' | '8_weeks' | '12_weeks';
  enabled?: boolean;
}

export function useDemandForecast(
  productId: number | null,
  options: UseDemandForecastOptions = {}
) {
  const { period = '4_weeks', enabled = true } = options;

  const [data, setData] = useState<DemandForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !enabled) {
      setData(null);
      setError(null);
      return;
    }

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await productService.getDemandForecast(productId, period);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar previsão de demanda';
        setError(errorMessage);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [productId, period, enabled]);

  const refetch = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await productService.getDemandForecast(productId, period);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar previsão de demanda';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
    isSuccess: !loading && !error && data !== null,
    isEmpty: !loading && !error && (!data || data.historical.length === 0),
  };
}
