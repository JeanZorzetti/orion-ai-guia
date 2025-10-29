'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Star,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  Search,
  RefreshCw,
  Play,
  Globe,
  Lock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReportTemplates } from '@/hooks/useReportTemplates';
import type { ReportTemplate, ReportConfig } from '@/types/report';

interface ReportTemplatesProps {
  onUseTemplate?: (config: ReportConfig) => void;
}

export const ReportTemplates: React.FC<ReportTemplatesProps> = ({ onUseTemplate }) => {
  const {
    templates,
    filters,
    setFilters,
    loading,
    refresh,
    deleteTemplate,
    duplicate,
    applyTemplate,
    toggleFavorite,
    togglePublic,
    stats
  } = useReportTemplates();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleDelete = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSelectTemplate = (template: ReportTemplate) => {
    applyTemplate(template.id);
    if (onUseTemplate) {
      onUseTemplate(template.config);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.favoritos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Públicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.publicos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mais Usado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {stats.maisUsados[0]?.nome || '-'}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.maisUsados[0]?.vezesUsado || 0} usos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates de Relatórios
              </CardTitle>
              <CardDescription>
                Use templates salvos para gerar relatórios rapidamente
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barra de busca e filtros */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={filters.busca || ''}
                onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.categoria?.[0] || 'todos'}
              onValueChange={(v) => setFilters({ ...filters, categoria: v === 'todos' ? undefined : [v as import('@/types/report').ReportTemplate['categoria']] })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="estoque">Estoque</SelectItem>
                <SelectItem value="vendas">Vendas</SelectItem>
                <SelectItem value="gerencial">Gerencial</SelectItem>
                <SelectItem value="custom">Customizado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.favoritos === true ? 'favoritos' : filters.publicos === true ? 'publicos' : 'todos'}
              onValueChange={(v) => {
                if (v === 'favoritos') {
                  setFilters({ ...filters, favoritos: true, publicos: undefined });
                } else if (v === 'publicos') {
                  setFilters({ ...filters, favoritos: undefined, publicos: true });
                } else {
                  setFilters({ ...filters, favoritos: undefined, publicos: undefined });
                }
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="favoritos">Favoritos</SelectItem>
                <SelectItem value="publicos">Públicos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground py-8">
                Nenhum template encontrado
              </div>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="relative">
                  {/* Ícone de favorito */}
                  {template.favorito && (
                    <div className="absolute top-3 right-3">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {template.nome}
                          {template.publico ? (
                            <Globe className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Lock className="h-3 w-3 text-gray-500" />
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm mt-1">
                          {template.descricao}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSelectTemplate(template)}>
                            <Play className="h-4 w-4 mr-2" />
                            Usar Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicate(template.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleFavorite(template.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            {template.favorito ? 'Remover favorito' : 'Adicionar aos favoritos'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublic(template.id)}>
                            {template.publico ? (
                              <Lock className="h-4 w-4 mr-2" />
                            ) : (
                              <Globe className="h-4 w-4 mr-2" />
                            )}
                            {template.publico ? 'Tornar privado' : 'Tornar público'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Metadados */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{template.categoria}</Badge>
                        <Badge variant="outline">{template.config.exportacao.formato.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Criado em {format(template.criadoEm, 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{template.vezesUsado} usos</span>
                      </div>
                      {template.ultimoUso && (
                        <div className="text-xs">
                          Último uso: {format(template.ultimoUso, 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      )}
                    </div>

                    {/* Botão de ação principal */}
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
