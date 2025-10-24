'use client';

import React from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { X, Star } from 'lucide-react';
import { FilterPreset } from '@/hooks/usePersistedFilters';

interface FilterPresetsProps<T> {
  presets: FilterPreset<T>[];
  activePreset: string | null;
  onApplyPreset: (presetId: string) => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterPresets<T>({
  presets,
  activePreset,
  onApplyPreset,
  onClearFilters,
  hasActiveFilters = false,
}: FilterPresetsProps<T>) {
  if (presets.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Star className="h-4 w-4" />
        <span className="font-medium">Filtros Rápidos:</span>
      </div>

      {presets.map((preset) => (
        <Button
          key={preset.id}
          variant={activePreset === preset.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onApplyPreset(preset.id)}
          className="gap-2"
        >
          {preset.icon && <span>{preset.icon}</span>}
          {preset.name}
          {activePreset === preset.id && (
            <Badge variant="secondary" className="ml-1 px-1 py-0 h-4 text-xs">
              ativo
            </Badge>
          )}
        </Button>
      ))}

      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}

/**
 * Badge para indicar que há filtros ativos
 */
export function ActiveFiltersBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Badge variant="secondary" className="ml-2">
      {count} filtro{count > 1 ? 's' : ''} ativo{count > 1 ? 's' : ''}
    </Badge>
  );
}
