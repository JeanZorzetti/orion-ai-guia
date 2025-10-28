'use client';

import { useMemo } from 'react';

export interface Communication {
  id: string;
  clienteId: string;
  contaReceberId: string;
  tipo: 'lembrete' | 'cobranca' | 'acordo' | 'manual';
  canal: 'email' | 'whatsapp' | 'sms' | 'telefone';
  status: 'enviado' | 'entregue' | 'lido' | 'respondido' | 'falha';
  assunto?: string;
  mensagem: string;
  dataEnvio: Date;
  dataLeitura?: Date;
  dataResposta?: Date;
  resposta?: string;
  enviadoPor: 'sistema' | 'usuario';
  usuarioId?: string;
  usuarioNome?: string;
}

// Mock data - será substituído por dados reais da API
const mockCommunications: Communication[] = [
  {
    id: '1',
    clienteId: '1',
    contaReceberId: '1',
    tipo: 'lembrete',
    canal: 'email',
    status: 'lido',
    assunto: 'Lembrete: Título NF-1234 vence em 3 dias',
    mensagem: 'Olá Cliente ABC Ltda, este é um lembrete sobre o título NF-1234 que vence em 3 dias...',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 dias atrás
    dataLeitura: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    enviadoPor: 'sistema',
  },
  {
    id: '2',
    clienteId: '1',
    contaReceberId: '1',
    tipo: 'cobranca',
    canal: 'whatsapp',
    status: 'respondido',
    mensagem: '⚠️ ATENÇÃO Cliente ABC Ltda\n\nTítulo NF-1234 vencido há 2 dias!\n\n💵 Valor atualizado: R$ 5.916,00',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 horas atrás
    dataLeitura: new Date(Date.now() - 1000 * 60 * 60 * 10), // 10 horas atrás
    dataResposta: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 horas atrás
    resposta: 'Oi! Vou fazer o pagamento hoje ainda pelo PIX. Obrigado!',
    enviadoPor: 'sistema',
  },
  {
    id: '3',
    clienteId: '2',
    contaReceberId: '2',
    tipo: 'manual',
    canal: 'telefone',
    status: 'enviado',
    mensagem: 'Ligação realizada às 14:30. Cliente solicitou prazo de 5 dias para regularização. Negociado desconto de 3% para pagamento antecipado.',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 horas atrás
    enviadoPor: 'usuario',
    usuarioId: 'user-1',
    usuarioNome: 'João Silva',
  },
  {
    id: '4',
    clienteId: '2',
    contaReceberId: '2',
    tipo: 'lembrete',
    canal: 'email',
    status: 'entregue',
    assunto: 'Lembrete: Título NF-1235 vence em 7 dias',
    mensagem: 'Prezada Empresa XYZ S.A., lembramos que o título NF-1235 vence em 7 dias...',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 dias atrás
    enviadoPor: 'sistema',
  },
  {
    id: '5',
    clienteId: '3',
    contaReceberId: '3',
    tipo: 'cobranca',
    canal: 'sms',
    status: 'falha',
    mensagem: 'URGENTE: Titulo NF-1236 vencido ha 8 dias. Valor: R$ 3.264,00. Regularize agora!',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
    enviadoPor: 'sistema',
  },
  {
    id: '6',
    clienteId: '1',
    contaReceberId: '1',
    tipo: 'acordo',
    canal: 'email',
    status: 'lido',
    assunto: 'Proposta de Acordo - Parcelamento em 3x',
    mensagem: 'Prezado cliente, confirmamos nossa proposta de parcelamento do débito em 3 parcelas de R$ 2.000,00...',
    dataEnvio: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 horas atrás
    dataLeitura: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
    enviadoPor: 'usuario',
    usuarioId: 'user-2',
    usuarioNome: 'Maria Santos',
  },
];

export function useCommunicationHistory(contaReceberId?: string): Communication[] {
  const communications = useMemo(() => {
    let filtered = [...mockCommunications];

    // Filtrar por conta a receber se fornecido
    if (contaReceberId) {
      filtered = filtered.filter(c => c.contaReceberId === contaReceberId);
    }

    // Ordenar por data de envio (mais recente primeiro)
    return filtered.sort((a, b) =>
      b.dataEnvio.getTime() - a.dataEnvio.getTime()
    );
  }, [contaReceberId]);

  return communications;
}

export function useCommunicationStats(contaReceberId?: string) {
  const communications = useCommunicationHistory(contaReceberId);

  return useMemo(() => {
    const stats = {
      total: communications.length,
      enviados: communications.filter(c => c.status === 'enviado').length,
      entregues: communications.filter(c => c.status === 'entregue').length,
      lidos: communications.filter(c => c.status === 'lido').length,
      respondidos: communications.filter(c => c.status === 'respondido').length,
      falhas: communications.filter(c => c.status === 'falha').length,
      taxaEntrega: 0,
      taxaLeitura: 0,
      taxaResposta: 0,
    };

    if (stats.total > 0) {
      stats.taxaEntrega = ((stats.entregues + stats.lidos + stats.respondidos) / stats.total) * 100;
      stats.taxaLeitura = ((stats.lidos + stats.respondidos) / stats.total) * 100;
      stats.taxaResposta = (stats.respondidos / stats.total) * 100;
    }

    return stats;
  }, [communications]);
}
