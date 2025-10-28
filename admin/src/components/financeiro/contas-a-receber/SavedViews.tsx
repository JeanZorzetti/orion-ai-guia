'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bookmark,
  BookmarkCheck,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
} from 'lucide-react';
import { ARFilters } from '@/components/financeiro/contas-a-receber/AdvancedFilters';
import { cn } from '@/lib/utils';

export interface SavedView {
  id: string;
  nome: string;
  descricao?: string;
  filters: ARFilters;
  isFavorito: boolean;
  dataCriacao: Date;
  ultimaUtilizacao?: Date;
  totalVezesSalva: number;
}

interface SavedViewsProps {
  savedViews: SavedView[];
  currentFilters: ARFilters;
  onLoadView: (filters: ARFilters) => void;
  onSaveView: (nome: string, descricao?: string) => void;
  onUpdateView: (id: string, nome: string, descricao?: string) => void;
  onDeleteView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const SavedViews: React.FC<SavedViewsProps> = ({
  savedViews,
  currentFilters,
  onLoadView,
  onSaveView,
  onUpdateView,
  onDeleteView,
  onToggleFavorite,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');

  const handleSaveNewView = () => {
    if (viewName.trim()) {
      onSaveView(viewName.trim(), viewDescription.trim() || undefined);
      setViewName('');
      setViewDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateView = () => {
    if (editingView && viewName.trim()) {
      onUpdateView(editingView.id, viewName.trim(), viewDescription.trim() || undefined);
      setViewName('');
      setViewDescription('');
      setEditingView(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleEditClick = (view: SavedView) => {
    setEditingView(view);
    setViewName(view.nome);
    setViewDescription(view.descricao || '');
    setIsEditDialogOpen(true);
  };

  const getActiveFiltersCount = (filters: ARFilters): number => {
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

  const favoriteViews = savedViews.filter((v) => v.isFavorito);
  const otherViews = savedViews.filter((v) => !v.isFavorito);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookmarkCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Visualizações Salvas</CardTitle>
              <CardDescription>
                {savedViews.length} visualiza{savedViews.length !== 1 ? 'ções' : 'ção'} salva{savedViews.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Salvar Nova
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Nova Visualização</DialogTitle>
                <DialogDescription>
                  Salve os filtros atuais para reutilizá-los rapidamente no futuro
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="view-name">Nome da Visualização</Label>
                  <Input
                    id="view-name"
                    placeholder="Ex: Contas Vencidas Alto Risco"
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="view-description">Descrição (opcional)</Label>
                  <Input
                    id="view-description"
                    placeholder="Ex: Contas com mais de 60 dias vencidas e risco alto"
                    value={viewDescription}
                    onChange={(e) => setViewDescription(e.target.value)}
                  />
                </div>
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-2">Filtros que serão salvos:</p>
                  <Badge variant="secondary">
                    {getActiveFiltersCount(currentFilters)} filtros ativos
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveNewView} disabled={!viewName.trim()}>
                  Salvar Visualização
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {savedViews.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Nenhuma visualização salva ainda
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Criar Primeira Visualização
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favoritos */}
            {favoriteViews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  Favoritos
                </h4>
                <div className="space-y-2">
                  {favoriteViews.map((view) => (
                    <ViewCard
                      key={view.id}
                      view={view}
                      onLoad={() => onLoadView(view.filters)}
                      onEdit={() => handleEditClick(view)}
                      onDelete={() => onDeleteView(view.id)}
                      onToggleFavorite={() => onToggleFavorite(view.id)}
                      getActiveFiltersCount={getActiveFiltersCount}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Outras Visualizações */}
            {otherViews.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">
                  Outras Visualizações
                </h4>
                <div className="space-y-2">
                  {otherViews.map((view) => (
                    <ViewCard
                      key={view.id}
                      view={view}
                      onLoad={() => onLoadView(view.filters)}
                      onEdit={() => handleEditClick(view)}
                      onDelete={() => onDeleteView(view.id)}
                      onToggleFavorite={() => onToggleFavorite(view.id)}
                      getActiveFiltersCount={getActiveFiltersCount}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Visualização</DialogTitle>
              <DialogDescription>
                Atualize o nome e descrição desta visualização
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-view-name">Nome da Visualização</Label>
                <Input
                  id="edit-view-name"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-view-description">Descrição (opcional)</Label>
                <Input
                  id="edit-view-description"
                  value={viewDescription}
                  onChange={(e) => setViewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingView(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateView} disabled={!viewName.trim()}>
                Atualizar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface ViewCardProps {
  view: SavedView;
  onLoad: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  getActiveFiltersCount: (filters: ARFilters) => number;
}

const ViewCard: React.FC<ViewCardProps> = ({
  view,
  onLoad,
  onEdit,
  onDelete,
  onToggleFavorite,
  getActiveFiltersCount,
}) => {
  return (
    <div
      className={cn(
        'group flex items-center justify-between p-3 border rounded-lg',
        'transition-all duration-200 hover:border-primary hover:shadow-sm',
        'cursor-pointer'
      )}
      onClick={onLoad}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-medium text-sm truncate">{view.nome}</h5>
          <Badge variant="secondary" className="text-xs">
            {getActiveFiltersCount(view.filters)} filtros
          </Badge>
        </div>
        {view.descricao && (
          <p className="text-xs text-muted-foreground truncate">{view.descricao}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>Usado {view.totalVezesSalva}x</span>
          {view.ultimaUtilizacao && (
            <span>• Última vez: {new Date(view.ultimaUtilizacao).toLocaleDateString('pt-BR')}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {view.isFavorito ? (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
