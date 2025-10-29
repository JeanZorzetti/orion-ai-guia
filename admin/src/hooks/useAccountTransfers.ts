import { useState, useEffect } from 'react';
import { subDays } from 'date-fns';
import type { Transferencia, BankAccount } from '@/types/cash-flow';

interface UseAccountTransfersReturn {
  transfers: Transferencia[];
  loading: boolean;
  addTransfer: (transfer: Omit<Transferencia, 'id'>) => void;
  getTransfersByAccount: (accountId: string) => Transferencia[];
}

export const useAccountTransfers = (): UseAccountTransfersReturn => {
  const [transfers, setTransfers] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransfers();
  }, []);

  const loadTransfers = () => {
    setLoading(true);
    try {
      // TODO: Integrar com API real quando disponível
      // Dados mockados para desenvolvimento
      const mockAccounts: BankAccount[] = [
        {
          id: '1',
          nome: 'Conta Corrente Principal',
          banco: 'Banco do Brasil',
          agencia: '1234-5',
          conta: '12345-6',
          tipo: 'corrente',
          saldo: 45280.30,
          ativa: true,
          corPrimaria: '#3b82f6'
        },
        {
          id: '2',
          nome: 'Conta Poupança',
          banco: 'Caixa Econômica Federal',
          agencia: '0987',
          conta: '98765-4',
          tipo: 'poupanca',
          saldo: 25000.00,
          ativa: true,
          corPrimaria: '#10b981'
        },
        {
          id: '3',
          nome: 'Investimentos CDB',
          banco: 'Itaú',
          agencia: '5678',
          conta: '56789-0',
          tipo: 'investimento',
          saldo: 150000.00,
          ativa: true,
          corPrimaria: '#8b5cf6'
        }
      ];

      const mockTransfers: Transferencia[] = [
        {
          id: '1',
          data: subDays(new Date(), 2),
          contaOrigem: mockAccounts[0],
          contaDestino: mockAccounts[1],
          valor: 5000.00,
          descricao: 'Transferência para poupança mensal',
          tipo: 'transferencia'
        },
        {
          id: '2',
          data: subDays(new Date(), 5),
          contaOrigem: mockAccounts[0],
          contaDestino: mockAccounts[2],
          valor: 20000.00,
          descricao: 'Aplicação em CDB',
          tipo: 'aplicacao'
        },
        {
          id: '3',
          data: subDays(new Date(), 10),
          contaOrigem: mockAccounts[2],
          contaDestino: mockAccounts[0],
          valor: 8500.00,
          descricao: 'Resgate parcial de investimento',
          tipo: 'resgate'
        },
        {
          id: '4',
          data: subDays(new Date(), 15),
          contaOrigem: mockAccounts[0],
          contaDestino: mockAccounts[1],
          valor: 3000.00,
          descricao: 'Reserva de emergência',
          tipo: 'transferencia'
        }
      ];

      setTransfers(mockTransfers);
    } catch (error) {
      console.error('Erro ao carregar transferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransfer = (transfer: Omit<Transferencia, 'id'>) => {
    const newTransfer: Transferencia = {
      ...transfer,
      id: Date.now().toString()
    };
    setTransfers([newTransfer, ...transfers]);
    // TODO: Salvar na API e atualizar saldos das contas
  };

  const getTransfersByAccount = (accountId: string) => {
    return transfers.filter(
      transfer =>
        transfer.contaOrigem.id === accountId ||
        transfer.contaDestino.id === accountId
    );
  };

  return {
    transfers,
    loading,
    addTransfer,
    getTransfersByAccount
  };
};
