'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useApprovalWorkflows } from '@/hooks/useApprovalWorkflows';
import { Plus, Edit, Trash2, Users, Clock } from 'lucide-react';

export const ApprovalWorkflowManager: React.FC = () => {
  const { workflows, toggleWorkflow } = useApprovalWorkflows();

  const handleCreateWorkflow = () => {
    // TODO: Abrir modal de criação
    console.log('Criar workflow');
  };

  const handleEditWorkflow = (workflowId: string) => {
    // TODO: Abrir modal de edição
    console.log('Editar workflow:', workflowId);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    // TODO: Confirmar e deletar
    console.log('Deletar workflow:', workflowId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fluxos de Aprovação</CardTitle>
            <CardDescription>
              Configure regras automáticas de aprovação para faturas
            </CardDescription>
          </div>
          <Button onClick={handleCreateWorkflow}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Fluxo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={workflow.ativo}
                    onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                  />
                  <div>
                    <h4 className="font-semibold">{workflow.nome}</h4>
                    <p className="text-sm text-muted-foreground">
                      {workflow.descricao}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={workflow.ativo ? 'default' : 'outline'}>
                    {workflow.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditWorkflow(workflow.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Condições */}
              <div className="bg-muted p-3 rounded-md mb-3">
                <p className="text-sm font-medium mb-2">Condições de Aplicação:</p>
                <div className="flex flex-wrap gap-2">
                  {workflow.condicoes.valorMinimo && (
                    <Badge variant="outline">
                      Mín: R$ {workflow.condicoes.valorMinimo.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                  {workflow.condicoes.valorMaximo && (
                    <Badge variant="outline">
                      Máx: R$ {workflow.condicoes.valorMaximo.toLocaleString('pt-BR')}
                    </Badge>
                  )}
                  {workflow.condicoes.fornecedores && workflow.condicoes.fornecedores.length > 0 && (
                    <Badge variant="outline">
                      {workflow.condicoes.fornecedores.length} fornecedores
                    </Badge>
                  )}
                  {workflow.condicoes.categorias && workflow.condicoes.categorias.length > 0 && (
                    <Badge variant="outline">
                      {workflow.condicoes.categorias.length} categorias
                    </Badge>
                  )}
                </div>
              </div>

              {/* Níveis */}
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">
                  Níveis de Aprovação ({workflow.niveis.length}):
                </p>
                {workflow.niveis.map((nivel) => (
                  <div key={nivel.nivel} className="flex items-center gap-3 text-sm bg-background p-2 rounded">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                      {nivel.nivel}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{nivel.nome}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {nivel.aprovadores.length} aprovadores
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {nivel.prazoHoras}h
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {nivel.tipoAprovacao.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
