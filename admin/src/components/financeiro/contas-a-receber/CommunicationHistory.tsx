'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Smartphone, Phone, Calendar, Eye, MessageCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { useCommunicationHistory } from '@/hooks/useCommunicationHistory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CommunicationHistoryProps {
  contaReceberId?: string;
}

const getChannelIcon = (canal: string) => {
  switch (canal) {
    case 'email':
      return <Mail className="h-4 w-4 text-blue-500" />;
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'sms':
      return <Smartphone className="h-4 w-4 text-purple-500" />;
    case 'telefone':
      return <Phone className="h-4 w-4 text-orange-500" />;
    default:
      return null;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'enviado':
      return <CheckCircle className="h-3 w-3 text-blue-500" />;
    case 'entregue':
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    case 'lido':
      return <Eye className="h-3 w-3 text-green-600" />;
    case 'respondido':
      return <MessageCircle className="h-3 w-3 text-green-700" />;
    case 'falha':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    default:
      return null;
  }
};

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'enviado':
      return 'secondary';
    case 'entregue':
    case 'lido':
      return 'default';
    case 'respondido':
      return 'default';
    case 'falha':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'enviado':
      return 'text-blue-600';
    case 'entregue':
      return 'text-green-500';
    case 'lido':
      return 'text-green-600';
    case 'respondido':
      return 'text-green-700';
    case 'falha':
      return 'text-red-600';
    default:
      return '';
  }
};

const getTipoLabel = (tipo: string): string => {
  switch (tipo) {
    case 'lembrete':
      return 'Lembrete';
    case 'cobranca':
      return 'Cobrança';
    case 'acordo':
      return 'Acordo';
    case 'manual':
      return 'Contato Manual';
    default:
      return tipo;
  }
};

const getTipoColor = (tipo: string): string => {
  switch (tipo) {
    case 'lembrete':
      return 'bg-blue-100 text-blue-700';
    case 'cobranca':
      return 'bg-orange-100 text-orange-700';
    case 'acordo':
      return 'bg-green-100 text-green-700';
    case 'manual':
      return 'bg-purple-100 text-purple-700';
    default:
      return '';
  }
};

export const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({ contaReceberId }) => {
  const communications = useCommunicationHistory(contaReceberId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Comunicação</CardTitle>
        <CardDescription>
          {communications.length} {communications.length === 1 ? 'interação registrada' : 'interações registradas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {communications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma comunicação registrada</p>
              </div>
            ) : (
              communications.map((comm) => (
                <div
                  key={comm.id}
                  className={cn(
                    'flex gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors',
                    comm.status === 'falha' && 'border-destructive/50 bg-destructive/5'
                  )}
                >
                  {/* Ícone do canal */}
                  <div className="flex-shrink-0 mt-1">
                    {getChannelIcon(comm.canal)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    {/* Cabeçalho */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', getTipoColor(comm.tipo))}>
                            {getTipoLabel(comm.tipo)}
                          </span>
                          <Badge variant={getStatusVariant(comm.status)} className={cn('text-xs', getStatusColor(comm.status))}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(comm.status)}
                              {comm.status}
                            </span>
                          </Badge>
                        </div>
                        {comm.assunto && (
                          <h4 className="font-semibold text-sm mt-1">{comm.assunto}</h4>
                        )}
                      </div>
                    </div>

                    {/* Mensagem */}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {comm.mensagem}
                    </p>

                    {/* Resposta do cliente */}
                    {comm.resposta && (
                      <div className="mt-2 p-2 bg-muted rounded-lg border-l-2 border-green-500">
                        <p className="text-xs font-medium text-green-700 mb-1">Resposta do cliente:</p>
                        <p className="text-sm">{comm.resposta}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                      {/* Data de envio */}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Enviado {formatDistanceToNow(comm.dataEnvio, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>

                      {/* Data de leitura */}
                      {comm.dataLeitura && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>
                              Lido {formatDistanceToNow(comm.dataLeitura, { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Data de resposta */}
                      {comm.dataResposta && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>
                              Respondido {formatDistanceToNow(comm.dataResposta, { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Enviado por */}
                      {comm.enviadoPor === 'usuario' && comm.usuarioNome && (
                        <>
                          <span>•</span>
                          <span>Por: {comm.usuarioNome}</span>
                        </>
                      )}
                      {comm.enviadoPor === 'sistema' && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">Automático</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
