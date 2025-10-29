'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Clock,
  Play,
  MoreVertical,
  Trash2,
  RefreshCw,
  Search,
  Copy,
  Edit,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useReportScheduler } from '@/hooks/useReportScheduler';
import type { ReportSchedule } from '@/types/report';

interface ScheduledReportsListProps {
  onEdit?: (schedule: ReportSchedule) => void;
  onCreate?: () => void;
}

const FrequenciaBadge: React.FC<{ frequencia: ReportSchedule['frequencia'] }> = ({ frequencia }) => {
  const labels = {
    diario: 'Diário',
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal',
    trimestral: 'Trimestral',
    anual: 'Anual',
    personalizado: 'Personalizado'
  };

  return (
    <Badge variant="outline">
      <Clock className="h-3 w-3 mr-1" />
      {labels[frequencia.tipo]}
    </Badge>
  );
};

export const ScheduledReportsList: React.FC<ScheduledReportsListProps> = ({ onEdit, onCreate }) => {
  const {
    schedules,
    filters,
    setFilters,
    loading,
    refresh,
    deleteSchedule,
    toggle,
    executeNow,
    duplicate,
    stats
  } = useReportScheduler();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const handleDelete = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (scheduleToDelete) {
      deleteSchedule(scheduleToDelete);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.ativos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Execuções com Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.execucoesComSucesso}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Execuções com Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.execucoesComErro}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de agendamentos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Relatórios Agendados
              </CardTitle>
              <CardDescription>
                Gerencie a automação de relatórios
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {onCreate && (
                <Button size="sm" onClick={onCreate}>
                  Novo Agendamento
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar agendamentos..."
                value={filters.busca || ''}
                onChange={(e) => setFilters({ ...filters, busca: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.ativo === undefined ? 'todos' : filters.ativo ? 'ativos' : 'inativos'}
              onValueChange={(v) => setFilters({ ...filters, ativo: v === 'todos' ? undefined : v === 'ativos' })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Frequência</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Destinatários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum agendamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <Switch
                          checked={schedule.ativo}
                          onCheckedChange={() => toggle(schedule.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{schedule.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.reportConfig.tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <FrequenciaBadge frequencia={schedule.frequencia} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(schedule.proximaExecucao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {schedule.ultimaExecucao ? (
                          <div className="flex items-center gap-1">
                            {schedule.execucoes[0]?.status === 'sucesso' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            {format(schedule.ultimaExecucao, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Nunca executado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {schedule.destinatarios.emails.length}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => executeNow(schedule.id)}>
                              <Play className="h-4 w-4 mr-2" />
                              Executar Agora
                            </DropdownMenuItem>
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(schedule)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => duplicate(schedule.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
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
