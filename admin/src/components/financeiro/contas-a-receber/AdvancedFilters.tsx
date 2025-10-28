'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Filter,
  X,
  ChevronDown,
  Calendar as CalendarIcon,
  Search,
  RefreshCcw,
  Bookmark
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ARFilters {
  status: string[];
  dataEmissaoInicio?: Date;
  dataEmissaoFim?: Date;
  dataVencimentoInicio?: Date;
  dataVencimentoFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
  clientes: string[];
  categoriasRisco: string[];
  faixasVencimento: string[];
  formasPagamento: string[];
  busca?: string;
  ordenacao: 'vencimento_asc' | 'vencimento_desc' | 'valor_asc' | 'valor_desc' | 'cliente_asc' | 'cliente_desc';
}

interface AdvancedFiltersProps {
  filters: ARFilters;
  onFiltersChange: (filters: ARFilters) => void;
  onSaveView?: () => void;
  totalResults?: number;
}

const statusOptions: MultiSelectOption[] = [
  { label: 'Pendente', value: 'pendente' },
  { label: 'Vencido', value: 'vencido' },
  { label: 'Recebido', value: 'recebido' },
  { label: 'Cancelado', value: 'cancelado' },
];

const clienteOptions: MultiSelectOption[] = [
  { label: 'Empresa ABC Ltda', value: '1' },
  { label: 'Comercial XYZ S.A.', value: '2' },
  { label: 'Distribuidora 123', value: '3' },
  { label: 'Indústria DEF', value: '4' },
  { label: 'Varejo GHI', value: '5' },
];

const riscoOptions: MultiSelectOption[] = [
  { label: 'Excelente', value: 'excelente' },
  { label: 'Bom', value: 'bom' },
  { label: 'Regular', value: 'regular' },
  { label: 'Ruim', value: 'ruim' },
  { label: 'Crítico', value: 'critico' },
];

const vencimentoOptions: MultiSelectOption[] = [
  { label: 'A vencer (0-30 dias)', value: 'a_vencer' },
  { label: 'Vencido 1-30 dias', value: 'vencido_30' },
  { label: 'Vencido 31-60 dias', value: 'vencido_60' },
  { label: 'Vencido 61-90 dias', value: 'vencido_90' },
  { label: 'Vencido 91-120 dias', value: 'vencido_120' },
  { label: 'Vencido 120+ dias', value: 'vencido_120plus' },
];

const pagamentoOptions: MultiSelectOption[] = [
  { label: 'Boleto', value: 'boleto' },
  { label: 'PIX', value: 'pix' },
  { label: 'Cartão de Crédito', value: 'cartao_credito' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Dinheiro', value: 'dinheiro' },
  { label: 'Cheque', value: 'cheque' },
];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onSaveView,
  totalResults,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const updateFilters = (updates: Partial<ARFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      clientes: [],
      categoriasRisco: [],
      faixasVencimento: [],
      formasPagamento: [],
      ordenacao: 'vencimento_desc',
    });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.dataEmissaoInicio || filters.dataEmissaoFim) count++;
    if (filters.dataVencimentoInicio || filters.dataVencimentoFim) count++;
    if (filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) count++;
    if (filters.clientes.length > 0) count++;
    if (filters.categoriasRisco.length > 0) count++;
    if (filters.faixasVencimento.length > 0) count++;
    if (filters.formasPagamento.length > 0) count++;
    if (filters.busca) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Filtros Avançados</CardTitle>
                <CardDescription>
                  {activeFiltersCount > 0 ? (
                    <span>
                      {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
                      {totalResults !== undefined && ` • ${totalResults} resultado${totalResults !== 1 ? 's' : ''}`}
                    </span>
                  ) : (
                    'Refine sua busca com filtros personalizados'
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Limpar
                </Button>
              )}
              {onSaveView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSaveView}
                  className="gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Salvar Visualização
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      !isOpen && '-rotate-90'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Busca Rápida */}
            <div className="space-y-2">
              <Label>Busca Rápida</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, número da conta, descrição..."
                  value={filters.busca || ''}
                  onChange={(e) => updateFilters({ busca: e.target.value })}
                  className="pl-10"
                />
                {filters.busca && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => updateFilters({ busca: undefined })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <MultiSelect
                  options={statusOptions}
                  value={filters.status}
                  onChange={(value) => updateFilters({ status: value })}
                  placeholder="Todos os status"
                />
              </div>

              {/* Clientes */}
              <div className="space-y-2">
                <Label>Clientes</Label>
                <MultiSelect
                  options={clienteOptions}
                  value={filters.clientes}
                  onChange={(value) => updateFilters({ clientes: value })}
                  placeholder="Todos os clientes"
                />
              </div>

              {/* Categoria de Risco */}
              <div className="space-y-2">
                <Label>Categoria de Risco</Label>
                <MultiSelect
                  options={riscoOptions}
                  value={filters.categoriasRisco}
                  onChange={(value) => updateFilters({ categoriasRisco: value })}
                  placeholder="Todas as categorias"
                />
              </div>

              {/* Faixas de Vencimento */}
              <div className="space-y-2">
                <Label>Faixas de Vencimento</Label>
                <MultiSelect
                  options={vencimentoOptions}
                  value={filters.faixasVencimento}
                  onChange={(value) => updateFilters({ faixasVencimento: value })}
                  placeholder="Todas as faixas"
                />
              </div>

              {/* Formas de Pagamento */}
              <div className="space-y-2">
                <Label>Formas de Pagamento</Label>
                <MultiSelect
                  options={pagamentoOptions}
                  value={filters.formasPagamento}
                  onChange={(value) => updateFilters({ formasPagamento: value })}
                  placeholder="Todas as formas"
                />
              </div>

              {/* Ordenação */}
              <div className="space-y-2">
                <Label>Ordenar Por</Label>
                <Select
                  value={filters.ordenacao}
                  onValueChange={(value) =>
                    updateFilters({
                      ordenacao: value as ARFilters['ordenacao'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vencimento_desc">Vencimento (mais recente)</SelectItem>
                    <SelectItem value="vencimento_asc">Vencimento (mais antigo)</SelectItem>
                    <SelectItem value="valor_desc">Valor (maior)</SelectItem>
                    <SelectItem value="valor_asc">Valor (menor)</SelectItem>
                    <SelectItem value="cliente_asc">Cliente (A-Z)</SelectItem>
                    <SelectItem value="cliente_desc">Cliente (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de Data */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Períodos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data de Emissão */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Data de Emissão</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !filters.dataEmissaoInicio && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataEmissaoInicio
                            ? format(filters.dataEmissaoInicio, 'dd/MM/yy')
                            : 'Início'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataEmissaoInicio}
                          onSelect={(date) =>
                            updateFilters({ dataEmissaoInicio: date })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !filters.dataEmissaoFim && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataEmissaoFim
                            ? format(filters.dataEmissaoFim, 'dd/MM/yy')
                            : 'Fim'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataEmissaoFim}
                          onSelect={(date) =>
                            updateFilters({ dataEmissaoFim: date })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Data de Vencimento */}
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Data de Vencimento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !filters.dataVencimentoInicio && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataVencimentoInicio
                            ? format(filters.dataVencimentoInicio, 'dd/MM/yy')
                            : 'Início'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataVencimentoInicio}
                          onSelect={(date) =>
                            updateFilters({ dataVencimentoInicio: date })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'justify-start text-left font-normal',
                            !filters.dataVencimentoFim && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dataVencimentoFim
                            ? format(filters.dataVencimentoFim, 'dd/MM/yy')
                            : 'Fim'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dataVencimentoFim}
                          onSelect={(date) =>
                            updateFilters({ dataVencimentoFim: date })
                          }
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtros de Valor */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Faixa de Valores</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Valor Mínimo</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.valorMinimo || ''}
                    onChange={(e) =>
                      updateFilters({
                        valorMinimo: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor Máximo</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={filters.valorMaximo || ''}
                    onChange={(e) =>
                      updateFilters({
                        valorMaximo: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Filtros Ativos */}
            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-xs text-muted-foreground">Filtros Ativos</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 text-xs"
                  >
                    Limpar Todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.status.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {filters.status.length}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ status: [] })}
                      />
                    </Badge>
                  )}
                  {filters.clientes.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Clientes: {filters.clientes.length}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ clientes: [] })}
                      />
                    </Badge>
                  )}
                  {filters.categoriasRisco.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Risco: {filters.categoriasRisco.length}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ categoriasRisco: [] })}
                      />
                    </Badge>
                  )}
                  {filters.faixasVencimento.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Vencimento: {filters.faixasVencimento.length}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ faixasVencimento: [] })}
                      />
                    </Badge>
                  )}
                  {filters.formasPagamento.length > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Pagamento: {filters.formasPagamento.length}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ formasPagamento: [] })}
                      />
                    </Badge>
                  )}
                  {(filters.dataEmissaoInicio || filters.dataEmissaoFim) && (
                    <Badge variant="secondary" className="gap-1">
                      Data Emissão
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          updateFilters({
                            dataEmissaoInicio: undefined,
                            dataEmissaoFim: undefined,
                          })
                        }
                      />
                    </Badge>
                  )}
                  {(filters.dataVencimentoInicio || filters.dataVencimentoFim) && (
                    <Badge variant="secondary" className="gap-1">
                      Data Vencimento
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          updateFilters({
                            dataVencimentoInicio: undefined,
                            dataVencimentoFim: undefined,
                          })
                        }
                      />
                    </Badge>
                  )}
                  {(filters.valorMinimo !== undefined || filters.valorMaximo !== undefined) && (
                    <Badge variant="secondary" className="gap-1">
                      Faixa de Valor
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() =>
                          updateFilters({
                            valorMinimo: undefined,
                            valorMaximo: undefined,
                          })
                        }
                      />
                    </Badge>
                  )}
                  {filters.busca && (
                    <Badge variant="secondary" className="gap-1">
                      Busca: &quot;{filters.busca}&quot;
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => updateFilters({ busca: undefined })}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
