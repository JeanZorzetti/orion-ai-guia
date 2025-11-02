import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

// API Response Types
interface InventorySummaryAPI {
  total_produtos: number;
  produtos_baixo_estoque: number;
  valor_total: number;
  movimentacoes_mes: number;
}

interface ProductLowStockAPI {
  id: number;
  name: string;
  sku: string | null;
  category: string | null;
  stock_quantity: number;
  min_stock_level: number;
}

// Frontend Types
export interface InventorySummary {
  totalProdutos: number;
  produtosBaixoEstoque: number;
  valorTotal: number;
  movimentacoesMes: number;
}

export interface ProductLowStock {
  id: number;
  nome: string;
  codigo: string;
  categoria: string;
  estoque: number;
  minimo: number;
}

export const useInventory = () => {
  const [summary, setSummary] = useState<InventorySummary>({
    totalProdutos: 0,
    produtosBaixoEstoque: 0,
    valorTotal: 0,
    movimentacoesMes: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<ProductLowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar resumo do estoque
  const fetchInventorySummary = useCallback(async () => {
    console.log('🔄 [useInventory] Buscando resumo do estoque da API');
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<InventorySummaryAPI>('/products/stats/inventory-summary');

      console.log('✅ [useInventory] Resumo recebido:', response);

      // Converter para o formato esperado pelo frontend
      setSummary({
        totalProdutos: response.total_produtos,
        produtosBaixoEstoque: response.produtos_baixo_estoque,
        valorTotal: response.valor_total,
        movimentacoesMes: response.movimentacoes_mes,
      });
    } catch (err) {
      console.error('❌ [useInventory] Erro ao buscar resumo do estoque:', err);
      // Sem fallback para mock - mostrar vazio se não houver dados
      setSummary({
        totalProdutos: 0,
        produtosBaixoEstoque: 0,
        valorTotal: 0,
        movimentacoesMes: 0,
      });
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    }
  }, []);

  // Buscar produtos com estoque baixo
  const fetchLowStockProducts = useCallback(async () => {
    console.log('🔄 [useInventory] Buscando produtos com estoque baixo da API');

    try {
      const response = await api.get<ProductLowStockAPI[]>('/products?low_stock=true&limit=10');

      console.log('✅ [useInventory] Produtos com estoque baixo recebidos:', response.length);

      // Converter para o formato esperado pelo frontend
      const converted: ProductLowStock[] = response.map(p => ({
        id: p.id,
        nome: p.name,
        codigo: p.sku || `PROD-${p.id}`,
        categoria: p.category || 'Sem Categoria',
        estoque: p.stock_quantity,
        minimo: p.min_stock_level,
      }));

      setLowStockProducts(converted);
    } catch (err) {
      console.error('❌ [useInventory] Erro ao buscar produtos com estoque baixo:', err);
      // Sem fallback para mock - mostrar vazio se não houver dados
      setLowStockProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar dados ao montar
  useEffect(() => {
    const fetchAll = async () => {
      await fetchInventorySummary();
      await fetchLowStockProducts();
    };

    fetchAll();
  }, [fetchInventorySummary, fetchLowStockProducts]);

  // Recarregar dados
  const refresh = useCallback(async () => {
    await fetchInventorySummary();
    await fetchLowStockProducts();
  }, [fetchInventorySummary, fetchLowStockProducts]);

  return {
    summary,
    lowStockProducts,
    loading,
    error,
    refresh,
  };
};
