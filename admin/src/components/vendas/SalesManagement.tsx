'use client';

import React, { useState } from 'react';
import { useSalesPipeline } from '@/hooks/useSalesPipeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Users,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Percent,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Opportunity } from '@/types/sales';

export const SalesManagement: React.FC = () => {
  const {
    pipeline,
    filteredOpportunities,
    stats,
    analytics,
    moveOpportunity,
    winOpportunity,
    loseOpportunity,
    loading,
  } = useSalesPipeline();

  const [selectedTab, setSelectedTab] = useState('pipeline');

  // Group opportunities by stage
  const opportunitiesByStage = pipeline.stages.map(stage => ({
    ...stage,
    opportunities: filteredOpportunities.filter(o => o.stage_id === stage.id && o.status === 'open'),
  }));

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'website': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'email': return 'bg-purple-100 text-purple-800';
      case 'referral': return 'bg-yellow-100 text-yellow-800';
      case 'marketplace': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pipeline Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stats.totalValue)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.openOpportunities} oportunidades abertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Ponderado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stats.weightedValue)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Com base na probabilidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Vitória</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.wonOpportunities} ganhas / {stats.lostOpportunities} perdidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stats.avgDealSize)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Por oportunidade</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline (Kanban)</TabsTrigger>
          <TabsTrigger value="list">Lista de Oportunidades</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Pipeline Kanban Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
              {opportunitiesByStage.map(stage => {
                const stageValue = stage.opportunities.reduce((sum, o) => sum + o.estimated_value, 0);
                const stageWeightedValue = stage.opportunities.reduce((sum, o) => sum + o.weighted_value, 0);

                return (
                  <Card key={stage.id} className="w-80 flex-shrink-0">
                    <CardHeader style={{ borderTop: `4px solid ${stage.color}` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{stage.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Percent className="h-3 w-3" />
                            {stage.win_probability}% probabilidade
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{stage.opportunities.length}</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stageValue)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Ponderado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stageWeightedValue)}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                      {stage.opportunities.map(opp => (
                        <Card key={opp.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3 space-y-2">
                            <div>
                              <h4 className="font-medium text-sm">{opp.title}</h4>
                              <p className="text-xs text-gray-600">{opp.customer_name}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-green-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(opp.estimated_value)}
                              </span>
                              <Badge className={getSourceColor(opp.source)} variant="outline">
                                {opp.source}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>Fecha: {format(new Date(opp.expected_close_date), 'dd/MM', { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Users className="h-3 w-3" />
                              <span>{opp.owner_name}</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {stage.order < pipeline.stages.length && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-xs"
                                  onClick={() => {
                                    const nextStage = pipeline.stages.find(s => s.order === stage.order + 1);
                                    if (nextStage) moveOpportunity(opp.id, nextStage.id);
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Avançar
                                </Button>
                              )}
                              {stage.order === pipeline.stages.length && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1 text-xs bg-green-600"
                                    onClick={() => winOpportunity(opp.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Ganhar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => loseOpportunity(opp.id, 'Não converteu')}
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Perder
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {stage.opportunities.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">Nenhuma oportunidade</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Oportunidades</CardTitle>
              <CardDescription>Visualização em lista com filtros avançados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estágio</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Valor Ponderado</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fecha em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.slice(0, 20).map(opp => (
                    <TableRow key={opp.id}>
                      <TableCell className="font-medium">{opp.title}</TableCell>
                      <TableCell>{opp.customer_name}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: pipeline.stages.find(s => s.id === opp.stage_id)?.color }}>
                          {opp.stage_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.estimated_value)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {opp.probability}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opp.weighted_value)}
                      </TableCell>
                      <TableCell className="text-sm">{opp.owner_name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(opp.status)}>
                          {opp.status === 'open' ? 'Aberta' :
                           opp.status === 'won' ? 'Ganha' :
                           opp.status === 'lost' ? 'Perdida' : 'Arquivada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(opp.expected_close_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Estágio</CardTitle>
                <CardDescription>Performance de cada etapa do funil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.stages.map(stage => (
                    <div key={stage.stage_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stage.stage_name}</span>
                        <span className="text-gray-600">{stage.conversion_rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{stage.opportunities_count} oportunidades</span>
                        <span>•</span>
                        <span>~{stage.avg_days_in_stage.toFixed(0)} dias</span>
                        <span>•</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(stage.total_value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Gerais</CardTitle>
                <CardDescription>Resumo de performance do período</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Conversão Geral</p>
                  <p className="text-2xl font-bold">{analytics.overall_conversion_rate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taxa de Vitória</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.win_rate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio de Fechamento</p>
                  <p className="text-2xl font-bold">{analytics.avg_days_to_close.toFixed(0)} dias</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Velocidade do Pipeline</p>
                  <p className="text-2xl font-bold">{analytics.velocity.opportunities_per_month} opp/mês</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
