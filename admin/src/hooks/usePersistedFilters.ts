import { useState, useEffect, useCallback } from 'react';

export interface FilterPreset<T> {
  id: string;
  name: string;
  filters: T;
  icon?: string;
}

interface UsePersistedFiltersOptions<T> {
  key: string;
  defaultFilters: T;
  presets?: FilterPreset<T>[];
}

interface UsePersistedFiltersReturn<T> {
  filters: T;
  setFilters: (filters: T) => void;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  clearFilters: () => void;
  applyPreset: (presetId: string) => void;
  presets: FilterPreset<T>[];
  activePreset: string | null;
}

/**
 * Hook para gerenciar filtros persistentes no localStorage
 *
 * @example
 * const { filters, updateFilter, clearFilters, applyPreset, presets } = usePersistedFilters({
 *   key: 'products-filters',
 *   defaultFilters: { search: '', category: 'all', status: 'all' },
 *   presets: [
 *     { id: 'active', name: 'Ativos', filters: { status: 'active' } },
 *     { id: 'lowStock', name: 'Estoque Baixo', filters: { stockLevel: 'low' } },
 *   ],
 * });
 */
export function usePersistedFilters<T extends Record<string, unknown>>({
  key,
  defaultFilters,
  presets = [],
}: UsePersistedFiltersOptions<T>): UsePersistedFiltersReturn<T> {
  const storageKey = `erp-filters-${key}`;
  const presetKey = `erp-preset-${key}`;

  // Estado dos filtros
  const [filters, setFiltersState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultFilters;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge com defaultFilters para garantir que novos filtros sejam adicionados
        return { ...defaultFilters, ...parsed };
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
    return defaultFilters;
  });

  // Estado do preset ativo
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      return localStorage.getItem(presetKey);
    } catch (error) {
      console.error('Error loading active preset:', error);
    }
    return null;
  });

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters, storageKey]);

  // Salvar preset ativo no localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (activePreset) {
        localStorage.setItem(presetKey, activePreset);
      } else {
        localStorage.removeItem(presetKey);
      }
    } catch (error) {
      console.error('Error saving active preset:', error);
    }
  }, [activePreset, presetKey]);

  // Atualizar filtros
  const setFilters = useCallback((newFilters: T) => {
    setFiltersState(newFilters);
    setActivePreset(null); // Limpar preset ativo ao mudar filtros manualmente
  }, []);

  // Atualizar um filtro específico
  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setActivePreset(null); // Limpar preset ativo ao mudar filtro
  }, []);

  // Limpar todos os filtros
  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setActivePreset(null);
  }, [defaultFilters]);

  // Aplicar preset
  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        // Merge preset filters com filtros atuais
        setFiltersState((prev) => ({ ...prev, ...preset.filters }));
        setActivePreset(presetId);
      }
    },
    [presets]
  );

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    applyPreset,
    presets,
    activePreset,
  };
}

/**
 * Hook simplificado para filtros sem presets
 */
export function useLocalStorageFilters<T extends Record<string, unknown>>(
  key: string,
  defaultFilters: T
) {
  const { filters, updateFilter, clearFilters } = usePersistedFilters({
    key,
    defaultFilters,
    presets: [],
  });

  return { filters, updateFilter, clearFilters };
}
