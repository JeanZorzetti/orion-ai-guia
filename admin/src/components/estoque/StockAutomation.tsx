'use client';

import React, { useState } from 'react';
import { useDemandForecast } from '@/hooks/useDemandForecast';
import { useStockAlerts } from '@/hooks/useStockAlerts';
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
  Brain,
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  Target,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const StockAutomation: React.FC = () => {
  const {
    filteredOptimizations,
    filteredSuggestions,
    stats: forecastStats,
    approveSuggestion,
    dismissSuggestion,
    loading: forecastLoading,
  } = useDemandForecast();

  const {
    filteredAlerts,
    rules,
    stats: alertStats,
    acknowledgeAlert,
    resolveAlert,
    toggleRule,
    loading: alertsLoading,
  } = useStockAlerts();

  const [selectedTab, setSelectedTab] = useState('overview');

  // Helpers
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'order_now': return 'bg-red-100 text-red-800';
      case 'order_soon': return 'bg-yellow-100 text-yellow-800';
      case 'sufficient': return 'bg-green-100 text-green-800';
      case 'excess': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Acurácia IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">{forecastStats.avgAccuracy.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Previsão de demanda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Sugestões Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{forecastStats.pendingSuggestions}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(forecastStats.suggestionsValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Alertas Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-2xl font-bold">{alertStats.criticalAlerts}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{alertStats.activeAlerts} alertas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{alertStats.automationSuccessRate.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Automações bem-sucedidas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="suggestions">
            Sugestões de Compra
            {forecastStats.pendingSuggestions > 0 && (
              <Badge className="ml-2 bg-blue-600">{forecastStats.pendingSuggestions}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="optimization">Otimização</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {alertStats.activeAlerts > 0 && (
              <Badge className="ml-2 bg-red-600">{alertStats.activeAlerts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Regras ({alertStats.activeRules})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Critical Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Ações Urgentes
                </CardTitle>
                <CardDescription>Produtos que precisam de atenção imediata</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredOptimizations
                    .filter(o => o.recommended_action === 'order_now')
                    .slice(0, 5)
                    .map(opt => (
                      <div key={opt.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{opt.product_name}</p>
                            <p className="text-sm text-gray-600">
                              Estoque: {opt.current_stock} | Ponto de pedido: {opt.reorder_point}
                            </p>
                          </div>
                          <Badge className="bg-red-600">Pedir Agora</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  Alertas Recentes
                </CardTitle>
                <CardDescription>Últimos alertas do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredAlerts
                    .filter(a => a.status === 'active')
                    .slice(0, 5)
                    .map(alert => (
                      <div key={alert.id} className="p-3 bg-gray-50 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <p className="text-sm font-medium">{alert.product_name}</p>
                            </div>
                            <p className="text-xs text-gray-600">{alert.message}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => acknowledgeAlert(alert.id, 'user-1')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Purchase Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sugestões Automáticas de Compra</CardTitle>
              <CardDescription>
                Baseadas em previsão de demanda e níveis de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Custo Est.</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuggestions.filter(s => s.status === 'pending').map(suggestion => (
                    <TableRow key={suggestion.id}>
                      <TableCell>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority === 'urgent' ? 'Urgente' :
                           suggestion.priority === 'high' ? 'Alta' :
                           suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{suggestion.product_name}</TableCell>
                      <TableCell>{suggestion.suggested_quantity}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(suggestion.estimated_cost)}
                      </TableCell>
                      <TableCell className="text-sm">{suggestion.reason}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(suggestion.order_by_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => approveSuggestion(suggestion.id, 'user-1')}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissSuggestion(suggestion.id, 'Não necessário')}
                          >
                            Descartar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Otimização de Estoque</CardTitle>
              <CardDescription>
                Pontos de pedido, estoque de segurança e quantidades ótimas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Ponto de Pedido</TableHead>
                    <TableHead>Estoque Segurança</TableHead>
                    <TableHead>Qtd. Ótima</TableHead>
                    <TableHead>Recomendação</TableHead>
                    <TableHead>Dias p/ Ruptura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOptimizations.slice(0, 15).map(opt => (
                    <TableRow key={opt.id}>
                      <TableCell className="font-medium">{opt.product_name}</TableCell>
                      <TableCell>{opt.current_stock}</TableCell>
                      <TableCell>{opt.reorder_point}</TableCell>
                      <TableCell>{opt.safety_stock}</TableCell>
                      <TableCell>{opt.optimal_order_quantity}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(opt.recommended_action)}>
                          {opt.recommended_action === 'order_now' ? 'Pedir Agora' :
                           opt.recommended_action === 'order_soon' ? 'Pedir Em Breve' :
                           opt.recommended_action === 'sufficient' ? 'Suficiente' : 'Excesso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {opt.days_until_stockout ? (
                          <span className={opt.days_until_stockout < 7 ? 'text-red-600 font-semibold' : ''}>
                            {opt.days_until_stockout} dias
                          </span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Central de Alertas</CardTitle>
              <CardDescription>Alertas inteligentes de estoque</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Ação Recomendada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.slice(0, 20).map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{alert.type}</TableCell>
                      <TableCell className="font-medium">{alert.product_name}</TableCell>
                      <TableCell className="text-sm">{alert.message}</TableCell>
                      <TableCell className="text-sm">{alert.recommended_action}</TableCell>
                      <TableCell>
                        <Badge variant={alert.status === 'resolved' ? 'default' : 'secondary'}>
                          {alert.status === 'active' ? 'Ativo' :
                           alert.status === 'acknowledged' ? 'Reconhecido' :
                           alert.status === 'resolved' ? 'Resolvido' : 'Descartado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {alert.status === 'active' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id, 'user-1')}
                            >
                              Reconhecer
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => resolveAlert(alert.id, 'Resolvido')}
                            >
                              Resolver
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Automação</CardTitle>
              <CardDescription>Configure alertas e ações automáticas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead>Ações Automáticas</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-xs text-gray-500">{rule.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{rule.type}</TableCell>
                      <TableCell className="text-sm">
                        {rule.applies_to === 'all' ? 'Todos' :
                         rule.applies_to === 'category' ? `${rule.category_ids?.length || 0} categorias` :
                         rule.applies_to === 'products' ? `${rule.product_ids?.length || 0} produtos` :
                         rule.applies_to === 'warehouse' ? `${rule.warehouse_ids?.length || 0} depósitos` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rule.auto_actions.length} ação(ões)
                      </TableCell>
                      <TableCell className="text-sm">{rule.check_frequency}</TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRule(rule.id)}
                        >
                          {rule.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
