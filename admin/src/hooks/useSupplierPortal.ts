import { useMemo, useState, useEffect } from 'react';
import { SupplierPortalData, SupplierPortalAccess } from '@/types/supplier-portal';
import { subDays, subMonths, addDays } from 'date-fns';

// Mock data de fornecedores com acesso
const mockPortalAccess: Record<string, SupplierPortalAccess> = {
  'token-alpha-2025': {
    id: 'access-001',
    fornecedorId: 'fornecedor-alpha',
    fornecedorNome: 'Alpha Distribuidora Ltda',
    token: 'token-alpha-2025',
    ativo: true,
    dataCriacao: subDays(new Date(), 30),
    criadoPor: 'João Silva',
    criadoPorId: 'user-001',
    ultimoAcesso: subDays(new Date(), 2),
    acessosTotal: 15,
  },
  'token-beta-2025': {
    id: 'access-002',
    fornecedorId: 'fornecedor-beta',
    fornecedorNome: 'Beta Suprimentos S.A.',
    token: 'token-beta-2025',
    ativo: true,
    dataCriacao: subDays(new Date(), 45),
    criadoPor: 'Maria Santos',
    criadoPorId: 'user-002',
    ultimoAcesso: subDays(new Date(), 1),
    acessosTotal: 28,
  },
  'token-gamma-2025': {
    id: 'access-003',
    fornecedorId: 'fornecedor-gamma',
    fornecedorNome: 'Gamma Indústria Ltda',
    token: 'token-gamma-2025',
    ativo: true,
    dataExpiracao: addDays(new Date(), 90),
    dataCriacao: subDays(new Date(), 15),
    criadoPor: 'João Silva',
    criadoPorId: 'user-001',
    ultimoAcesso: subDays(new Date(), 5),
    acessosTotal: 8,
  },
};

// Mock data do portal por fornecedor
const mockPortalData: Record<string, SupplierPortalData> = {
  'fornecedor-alpha': {
    fornecedor: {
      id: 'fornecedor-alpha',
      nome: 'Alpha Distribuidora Ltda',
      cnpj: '12.345.678/0001-90',
      email: 'contato@alphadistribuidora.com.br',
      telefone: '(11) 3456-7890',
    },
    resumo: {
      totalAReceber: 33000,
      pendenteAprovacao: 2,
      pagoMes: 45000,
      proximoPagamento: addDays(new Date(), 5),
      totalFaturas: 12,
      faturasPendentes: 2,
      faturasValidadas: 3,
      faturasPagas: 7,
    },
    faturas: [
      {
        id: 'fatura-alpha-001',
        invoice_number: 'INV-ALPHA-2025-001',
        invoice_date: subDays(new Date(), 10),
        due_date: addDays(new Date(), 5),
        total_value: 15000,
        status: 'validada',
        status_aprovacao: 'aprovada',
        descricao: 'Fornecimento de materiais - Pedido #12345',
      },
      {
        id: 'fatura-alpha-002',
        invoice_number: 'INV-ALPHA-2025-002',
        invoice_date: subDays(new Date(), 8),
        due_date: addDays(new Date(), 7),
        total_value: 18000,
        status: 'validada',
        status_aprovacao: 'aprovada',
        descricao: 'Fornecimento de equipamentos',
      },
      {
        id: 'fatura-alpha-003',
        invoice_number: 'INV-ALPHA-2025-003',
        invoice_date: subDays(new Date(), 5),
        due_date: addDays(new Date(), 10),
        total_value: 22000,
        status: 'pendente',
        status_aprovacao: 'aguardando',
        descricao: 'Fornecimento de produtos diversos',
      },
      {
        id: 'fatura-alpha-004',
        invoice_number: 'INV-ALPHA-2024-099',
        invoice_date: subDays(new Date(), 45),
        due_date: subDays(new Date(), 30),
        payment_date: subDays(new Date(), 28),
        total_value: 12000,
        status: 'paga',
        descricao: 'Fornecimento mensal - Dezembro/2024',
      },
      {
        id: 'fatura-alpha-005',
        invoice_number: 'INV-ALPHA-2024-098',
        invoice_date: subDays(new Date(), 75),
        due_date: subDays(new Date(), 60),
        payment_date: subDays(new Date(), 58),
        total_value: 15000,
        status: 'paga',
        descricao: 'Fornecimento mensal - Novembro/2024',
      },
    ],
    historicoMensal: [
      { mes: 'Jan/2025', totalPago: 45000, quantidadeFaturas: 3 },
      { mes: 'Dez/2024', totalPago: 38000, quantidadeFaturas: 2 },
      { mes: 'Nov/2024', totalPago: 42000, quantidadeFaturas: 3 },
      { mes: 'Out/2024', totalPago: 35000, quantidadeFaturas: 2 },
      { mes: 'Set/2024', totalPago: 40000, quantidadeFaturas: 3 },
      { mes: 'Ago/2024', totalPago: 37000, quantidadeFaturas: 2 },
    ],
  },
  'fornecedor-beta': {
    fornecedor: {
      id: 'fornecedor-beta',
      nome: 'Beta Suprimentos S.A.',
      cnpj: '98.765.432/0001-10',
      email: 'financeiro@betasuprimentos.com.br',
      telefone: '(11) 9876-5432',
    },
    resumo: {
      totalAReceber: 25500,
      pendenteAprovacao: 1,
      pagoMes: 32000,
      proximoPagamento: addDays(new Date(), 3),
      totalFaturas: 8,
      faturasPendentes: 1,
      faturasValidadas: 2,
      faturasPagas: 5,
    },
    faturas: [
      {
        id: 'fatura-beta-001',
        invoice_number: 'INV-BETA-2025-001',
        invoice_date: subDays(new Date(), 7),
        due_date: addDays(new Date(), 3),
        total_value: 8500,
        status: 'validada',
        status_aprovacao: 'aprovada',
        descricao: 'Fornecimento de insumos',
      },
      {
        id: 'fatura-beta-002',
        invoice_number: 'INV-BETA-2025-002',
        invoice_date: subDays(new Date(), 12),
        due_date: addDays(new Date(), 8),
        total_value: 17000,
        status: 'validada',
        status_aprovacao: 'aprovada',
        descricao: 'Fornecimento mensal',
      },
      {
        id: 'fatura-beta-003',
        invoice_number: 'INV-BETA-2024-099',
        invoice_date: subDays(new Date(), 35),
        due_date: subDays(new Date(), 20),
        payment_date: subDays(new Date(), 18),
        total_value: 10000,
        status: 'paga',
        descricao: 'Fornecimento - Dezembro/2024',
      },
    ],
    historicoMensal: [
      { mes: 'Jan/2025', totalPago: 32000, quantidadeFaturas: 2 },
      { mes: 'Dez/2024', totalPago: 28000, quantidadeFaturas: 2 },
      { mes: 'Nov/2024', totalPago: 30000, quantidadeFaturas: 2 },
      { mes: 'Out/2024', totalPago: 25000, quantidadeFaturas: 1 },
    ],
  },
  'fornecedor-gamma': {
    fornecedor: {
      id: 'fornecedor-gamma',
      nome: 'Gamma Indústria Ltda',
      cnpj: '11.222.333/0001-44',
      email: 'contabil@gammaindustria.com.br',
      telefone: '(11) 1122-3344',
    },
    resumo: {
      totalAReceber: 52000,
      pendenteAprovacao: 1,
      pagoMes: 22000,
      proximoPagamento: addDays(new Date(), 10),
      totalFaturas: 6,
      faturasPendentes: 1,
      faturasValidadas: 1,
      faturasPagas: 4,
    },
    faturas: [
      {
        id: 'fatura-gamma-001',
        invoice_number: 'INV-GAMMA-2025-001',
        invoice_date: subDays(new Date(), 5),
        due_date: addDays(new Date(), 10),
        total_value: 22000,
        status: 'validada',
        status_aprovacao: 'aprovada',
        descricao: 'Equipamentos industriais',
      },
      {
        id: 'fatura-gamma-002',
        invoice_number: 'INV-GAMMA-2025-002',
        invoice_date: subDays(new Date(), 3),
        due_date: addDays(new Date(), 12),
        total_value: 30000,
        status: 'pendente',
        status_aprovacao: 'aguardando',
        descricao: 'Maquinário pesado',
      },
      {
        id: 'fatura-gamma-003',
        invoice_number: 'INV-GAMMA-2024-099',
        invoice_date: subDays(new Date(), 25),
        due_date: subDays(new Date(), 10),
        payment_date: subDays(new Date(), 8),
        total_value: 22000,
        status: 'paga',
        descricao: 'Fornecimento - Janeiro/2025',
      },
    ],
    historicoMensal: [
      { mes: 'Jan/2025', totalPago: 22000, quantidadeFaturas: 1 },
      { mes: 'Dez/2024', totalPago: 44000, quantidadeFaturas: 2 },
      { mes: 'Nov/2024', totalPago: 33000, quantidadeFaturas: 1 },
      { mes: 'Out/2024', totalPago: 55000, quantidadeFaturas: 2 },
    ],
  },
};

export const useSupplierPortal = (token: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [data, setData] = useState<SupplierPortalData | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setIsValidToken(false);
      return;
    }

    // Simular chamada à API
    setTimeout(() => {
      const access = mockPortalAccess[token];

      if (access && access.ativo) {
        const portalData = mockPortalData[access.fornecedorId];

        if (portalData) {
          setData(portalData);
          setIsValidToken(true);

          // TODO: Registrar acesso
          console.log('Acesso registrado para:', access.fornecedorNome);
        } else {
          setIsValidToken(false);
        }
      } else {
        setIsValidToken(false);
      }

      setIsLoading(false);
    }, 500);
  }, [token]);

  return { data, isLoading, isValidToken };
};

export const generateSupplierAccess = (
  fornecedorId: string,
  fornecedorNome: string,
  dataExpiracao?: Date
): Promise<SupplierPortalAccess> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      const token = `token-${fornecedorId}-${Date.now()}`;
      const access: SupplierPortalAccess = {
        id: `access-${Date.now()}`,
        fornecedorId,
        fornecedorNome,
        token,
        ativo: true,
        dataExpiracao,
        dataCriacao: new Date(),
        criadoPor: 'Admin User',
        criadoPorId: 'admin-001',
        acessosTotal: 0,
      };
      resolve(access);
    }, 500);
  });
};

export const revokeSupplierAccess = (accessId: string): Promise<boolean> => {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Acesso revogado:', accessId);
      resolve(true);
    }, 500);
  });
};
