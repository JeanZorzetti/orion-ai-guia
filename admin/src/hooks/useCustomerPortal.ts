'use client';

import { useState, useEffect } from 'react';
import { addDays } from 'date-fns';

export interface PortalToken {
  token: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  clienteCpfCnpj: string;
  expiresAt: Date;
  createdAt: Date;
  isValid: boolean;
}

export interface ContaReceberPortal {
  id: string;
  numeroDocumento: string;
  dataEmissao: Date;
  dataVencimento: Date;
  valor: number;
  valorPago: number;
  saldo: number;
  status: 'pendente' | 'vencido' | 'recebido' | 'parcial';
  descricao: string;
  diasVencido: number;
  formaPagamento: string;
  observacoes?: string;
}

export interface CustomerPortalData {
  cliente: {
    id: string;
    nome: string;
    email: string;
    cpfCnpj: string;
    telefone?: string;
  };
  titulos: ContaReceberPortal[];
  resumo: {
    totalEmAberto: number;
    totalVencido: number;
    quantidadeVencidos: number;
    proximoVencimento: Date | null;
  };
}

interface UseCustomerPortalReturn {
  data: CustomerPortalData | null;
  isLoading: boolean;
  error: string | null;
  isValidToken: boolean;
  refreshData: () => Promise<void>;
}

// Mock data - em produção viria do backend via API
const mockPortalData: Record<string, CustomerPortalData> = {
  'demo-token-abc123': {
    cliente: {
      id: '1',
      nome: 'Empresa ABC Ltda',
      email: 'contato@empresaabc.com.br',
      cpfCnpj: '12.345.678/0001-90',
      telefone: '(11) 98765-4321',
    },
    titulos: [
      {
        id: '1',
        numeroDocumento: 'NF-1234',
        dataEmissao: new Date('2024-12-05'),
        dataVencimento: addDays(new Date(), 5),
        valor: 5800.0,
        valorPago: 0,
        saldo: 5800.0,
        status: 'pendente',
        descricao: 'Venda de produtos - Pedido #1234',
        diasVencido: 0,
        formaPagamento: 'boleto',
      },
      {
        id: '4',
        numeroDocumento: 'NF-1237',
        dataEmissao: new Date('2024-12-01'),
        dataVencimento: new Date('2024-12-15'),
        valor: 8950.0,
        valorPago: 8950.0,
        saldo: 0,
        status: 'recebido',
        descricao: 'Manutenção - Contrato anual',
        diasVencido: 0,
        formaPagamento: 'pix',
        observacoes: 'Pagamento confirmado em 15/12/2024',
      },
      {
        id: '7',
        numeroDocumento: 'NF-1240',
        dataEmissao: new Date('2024-11-01'),
        dataVencimento: addDays(new Date(), -15),
        valor: 3200.0,
        valorPago: 1500.0,
        saldo: 1700.0,
        status: 'parcial',
        descricao: 'Serviços de consultoria',
        diasVencido: 15,
        formaPagamento: 'transferencia',
        observacoes: 'Pagamento parcial recebido',
      },
    ],
    resumo: {
      totalEmAberto: 7500.0,
      totalVencido: 1700.0,
      quantidadeVencidos: 1,
      proximoVencimento: addDays(new Date(), 5),
    },
  },
  'demo-token-xyz456': {
    cliente: {
      id: '2',
      nome: 'Comercial XYZ S.A.',
      email: 'financeiro@comercialxyz.com.br',
      cpfCnpj: '98.765.432/0001-10',
      telefone: '(11) 91234-5678',
    },
    titulos: [
      {
        id: '2',
        numeroDocumento: 'NF-1235',
        dataEmissao: new Date('2024-12-10'),
        dataVencimento: addDays(new Date(), 26),
        valor: 12500.0,
        valorPago: 0,
        saldo: 12500.0,
        status: 'pendente',
        descricao: 'Serviços de consultoria',
        diasVencido: 0,
        formaPagamento: 'pix',
      },
      {
        id: '8',
        numeroDocumento: 'NF-1241',
        dataEmissao: new Date('2024-10-15'),
        dataVencimento: addDays(new Date(), -45),
        valor: 8900.0,
        valorPago: 0,
        saldo: 8900.0,
        status: 'vencido',
        descricao: 'Venda de equipamentos',
        diasVencido: 45,
        formaPagamento: 'boleto',
      },
    ],
    resumo: {
      totalEmAberto: 21400.0,
      totalVencido: 8900.0,
      quantidadeVencidos: 1,
      proximoVencimento: addDays(new Date(), 26),
    },
  },
};

export function useCustomerPortal(token: string): UseCustomerPortalReturn {
  const [data, setData] = useState<CustomerPortalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulação de chamada API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Validar token
      if (!mockPortalData[token]) {
        setIsValidToken(false);
        setError('Token inválido ou expirado');
        setData(null);
        return;
      }

      setIsValidToken(true);
      setData(mockPortalData[token]);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const refreshData = async () => {
    await loadData();
  };

  return {
    data,
    isLoading,
    error,
    isValidToken,
    refreshData,
  };
}

// Hook para gerar token de acesso (usado no admin)
export function useGeneratePortalToken() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateToken = async (
    clienteId: string,
    clienteEmail: string
  ): Promise<string | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulação de chamada API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Gerar token único
      const token = `demo-token-${clienteId}-${Date.now().toString(36)}`;

      // Em produção, salvaria no banco e enviaria email
      console.log('Token gerado:', token);
      console.log('Email enviado para:', clienteEmail);
      console.log(
        'Link:',
        `${window.location.origin}/portal/cliente/${token}`
      );

      return token;
    } catch (err) {
      setError('Erro ao gerar token');
      console.error(err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateToken,
    isGenerating,
    error,
  };
}
