'use client';

import { useState, useMemo, useCallback } from 'react';
import { ARFilters } from '@/components/financeiro/contas-a-receber/AdvancedFilters';
import { isWithinInterval, isAfter, isBefore } from 'date-fns';

export interface ContaReceber {
  id: string;
  numeroDocumento: string;
  clienteId: string;
  clienteNome: string;
  dataEmissao: Date;
  dataVencimento: Date;
  valor: number;
  valorPago: number;
  status: 'pendente' | 'vencido' | 'recebido' | 'cancelado';
  descricao: string;
  formaPagamento: string;
  categoriaRisco?: 'excelente' | 'bom' | 'regular' | 'ruim' | 'critico';
  diasVencido?: number;
}

interface UseARFiltersReturn {
  filters: ARFilters;
  setFilters: (filters: ARFilters) => void;
  updateFilters: (updates: Partial<ARFilters>) => void;
  resetFilters: () => void;
  filteredData: ContaReceber[];
  totalResults: number;
  isFiltering: boolean;
}

const defaultFilters: ARFilters = {
  status: [],
  clientes: [],
  categoriasRisco: [],
  faixasVencimento: [],
  formasPagamento: [],
  ordenacao: 'vencimento_desc',
};

export function useARFilters(data: ContaReceber[]): UseARFiltersReturn {
  const [filters, setFilters] = useState<ARFilters>(defaultFilters);

  const updateFilters = useCallback((updates: Partial<ARFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Filtro de busca rápida
    if (filters.busca) {
      const searchTerm = filters.busca.toLowerCase();
      result = result.filter(
        (item) =>
          item.clienteNome.toLowerCase().includes(searchTerm) ||
          item.numeroDocumento.toLowerCase().includes(searchTerm) ||
          item.descricao.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de status
    if (filters.status.length > 0) {
      result = result.filter((item) => filters.status.includes(item.status));
    }

    // Filtro de clientes
    if (filters.clientes.length > 0) {
      result = result.filter((item) => filters.clientes.includes(item.clienteId));
    }

    // Filtro de categoria de risco
    if (filters.categoriasRisco.length > 0) {
      result = result.filter(
        (item) => item.categoriaRisco && filters.categoriasRisco.includes(item.categoriaRisco)
      );
    }

    // Filtro de faixas de vencimento
    if (filters.faixasVencimento.length > 0) {
      result = result.filter((item) => {
        if (item.diasVencido === undefined) return false;

        return filters.faixasVencimento.some((faixa) => {
          const dias = item.diasVencido!;
          switch (faixa) {
            case 'a_vencer':
              return dias >= 0 && dias <= 30;
            case 'vencido_30':
              return dias > 0 && dias <= 30;
            case 'vencido_60':
              return dias > 30 && dias <= 60;
            case 'vencido_90':
              return dias > 60 && dias <= 90;
            case 'vencido_120':
              return dias > 90 && dias <= 120;
            case 'vencido_120plus':
              return dias > 120;
            default:
              return false;
          }
        });
      });
    }

    // Filtro de formas de pagamento
    if (filters.formasPagamento.length > 0) {
      result = result.filter((item) => filters.formasPagamento.includes(item.formaPagamento));
    }

    // Filtro de data de emissão
    if (filters.dataEmissaoInicio && filters.dataEmissaoFim) {
      result = result.filter((item) =>
        isWithinInterval(item.dataEmissao, {
          start: filters.dataEmissaoInicio!,
          end: filters.dataEmissaoFim!,
        })
      );
    } else if (filters.dataEmissaoInicio) {
      result = result.filter((item) => isAfter(item.dataEmissao, filters.dataEmissaoInicio!) ||
        item.dataEmissao.getTime() === filters.dataEmissaoInicio!.getTime());
    } else if (filters.dataEmissaoFim) {
      result = result.filter((item) => isBefore(item.dataEmissao, filters.dataEmissaoFim!) ||
        item.dataEmissao.getTime() === filters.dataEmissaoFim!.getTime());
    }

    // Filtro de data de vencimento
    if (filters.dataVencimentoInicio && filters.dataVencimentoFim) {
      result = result.filter((item) =>
        isWithinInterval(item.dataVencimento, {
          start: filters.dataVencimentoInicio!,
          end: filters.dataVencimentoFim!,
        })
      );
    } else if (filters.dataVencimentoInicio) {
      result = result.filter((item) => isAfter(item.dataVencimento, filters.dataVencimentoInicio!) ||
        item.dataVencimento.getTime() === filters.dataVencimentoInicio!.getTime());
    } else if (filters.dataVencimentoFim) {
      result = result.filter((item) => isBefore(item.dataVencimento, filters.dataVencimentoFim!) ||
        item.dataVencimento.getTime() === filters.dataVencimentoFim!.getTime());
    }

    // Filtro de valor mínimo
    if (filters.valorMinimo !== undefined) {
      result = result.filter((item) => item.valor >= filters.valorMinimo!);
    }

    // Filtro de valor máximo
    if (filters.valorMaximo !== undefined) {
      result = result.filter((item) => item.valor <= filters.valorMaximo!);
    }

    // Ordenação
    result.sort((a, b) => {
      switch (filters.ordenacao) {
        case 'vencimento_asc':
          return a.dataVencimento.getTime() - b.dataVencimento.getTime();
        case 'vencimento_desc':
          return b.dataVencimento.getTime() - a.dataVencimento.getTime();
        case 'valor_asc':
          return a.valor - b.valor;
        case 'valor_desc':
          return b.valor - a.valor;
        case 'cliente_asc':
          return a.clienteNome.localeCompare(b.clienteNome);
        case 'cliente_desc':
          return b.clienteNome.localeCompare(a.clienteNome);
        default:
          return 0;
      }
    });

    return result;
  }, [data, filters]);

  const isFiltering = useMemo(() => {
    return (
      filters.status.length > 0 ||
      filters.clientes.length > 0 ||
      filters.categoriasRisco.length > 0 ||
      filters.faixasVencimento.length > 0 ||
      filters.formasPagamento.length > 0 ||
      filters.dataEmissaoInicio !== undefined ||
      filters.dataEmissaoFim !== undefined ||
      filters.dataVencimentoInicio !== undefined ||
      filters.dataVencimentoFim !== undefined ||
      filters.valorMinimo !== undefined ||
      filters.valorMaximo !== undefined ||
      (filters.busca !== undefined && filters.busca.length > 0)
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    filteredData,
    totalResults: filteredData.length,
    isFiltering,
  };
}
