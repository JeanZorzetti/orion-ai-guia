'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { CheckCircle2, XCircle, Eye, Clock, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/ui/empty-state';

export const PendingApprovalsPanel: React.FC = () => {
  // TODO: Pegar usuário do contexto de autenticação
  const userId = '1'; // Mock: Carlos Silva
  const { approvalRequests, approve, reject } = usePendingApprovals(userId);

  const handleApprove = async (requestId: string) => {
    await approve(requestId);
    // TODO: Mostrar toast de sucesso e recarregar
  };

  const handleReject = async (requestId: string) => {
    await reject(requestId, 'Rejeitado pelo aprovador');
    // TODO: Mostrar toast e recarregar
  };

  const handleViewInvoice = (faturaId: string) => {
    console.log('Ver fatura:', faturaId);
    // TODO: Navegar para detalhes da fatura
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Aprovações Pendentes
          {approvalRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {approvalRequests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvalRequests.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma aprovação pendente"
            description="Você está em dia com suas aprovações!"
          />
        ) : (
          <div className="space-y-4">
            {approvalRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        Fatura #{request.fatura.invoice_number}
                      </h4>
                      <Badge>
                        Nível {request.nivelAtual} de {request.nivelTotal}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fornecedor: {request.fatura.supplier?.name}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      Valor: R$ {request.fatura.total_value.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Workflow: {request.workflowNome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Prazo</p>
                    <p className="text-sm font-semibold flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(request.dataLimite, {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>

                {/* Timeline de aprovações */}
                <div className="mb-4 pl-4 border-l-2 border-muted space-y-3">
                  {request.aprovacoes.map((approval) => (
                    <div key={`${approval.nivel}-${approval.aprovadorId}`} className="relative">
                      <div className="absolute -left-[25px] top-1">
                        {approval.status === 'aprovado' && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {approval.status === 'rejeitado' && (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        {approval.status === 'pendente' && (
                          <Clock className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium">{approval.aprovadorNome}</p>
                        <p className="text-muted-foreground">
                          {approval.status === 'aprovado' &&
                            `Aprovado ${formatDistanceToNow(approval.dataAprovacao!, {
                              addSuffix: true,
                              locale: ptBR,
                            })}`}
                          {approval.status === 'rejeitado' &&
                            `Rejeitado ${formatDistanceToNow(approval.dataAprovacao!, {
                              addSuffix: true,
                              locale: ptBR,
                            })}`}
                          {approval.status === 'pendente' && 'Aguardando aprovação'}
                        </p>
                        {approval.observacoes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            &quot;{approval.observacoes}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewInvoice(request.faturaId)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Fatura
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(request.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(request.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
