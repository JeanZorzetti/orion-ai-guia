import { useState, useEffect, useMemo } from 'react';
import { SupplierPortalData, SupplierPortalAccess, SupplierPortalInvoice } from '@/types/supplier-portal';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';

// ===== INTERFACES para dados da API =====

interface SupplierAPI {
  id: number;
  name: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

interface APInvoiceAPI {
  id: number;
  invoice_number: string;
  supplier_id: number;
  supplier?: {
    id: number;
    name: string;
  };
  total_value: number;
  due_date: string;
  invoice_date: string;
  payment_date?: string;
  status: string;
  description?: string;
}

// ===== HOOK para buscar dados do portal do fornecedor =====

export const useSupplierPortal = (token: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [data, setData] = useState<SupplierPortalData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setIsValidToken(false);
      return;
    }

    const fetchPortalData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('🔍 [useSupplierPortal] Buscando dados do portal com token:', token);

        // Por enquanto, vamos simular o token sendo o ID do fornecedor
        // Formato esperado: "supplier-{id}" ou apenas o ID numérico
        const supplierId = token.replace('supplier-', '').replace(/[^0-9]/g, '');

        if (!supplierId || isNaN(parseInt(supplierId))) {
          console.error('❌ [useSupplierPortal] Token inválido');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        // Buscar informações do fornecedor
        console.log('🔍 [useSupplierPortal] Buscando fornecedor ID:', supplierId);
        const supplier = await api.get<SupplierAPI>(`/suppliers/${supplierId}`);

        if (!supplier || !supplier.is_active) {
          console.error('❌ [useSupplierPortal] Fornecedor não encontrado ou inativo');
          setIsValidToken(false);
          setIsLoading(false);
          return;
        }

        console.log('✅ [useSupplierPortal] Fornecedor encontrado:', supplier.name);

        // Buscar faturas do fornecedor
        console.log('🔍 [useSupplierPortal] Buscando faturas do fornecedor...');
        const invoices = await api.get<APInvoiceAPI[]>(
          `/accounts-payable/invoices?supplier_id=${supplierId}&limit=1000`
        );
        console.log('✅ [useSupplierPortal] Faturas recebidas:', invoices?.length || 0);

        // Processar dados
        const allInvoices = invoices || [];

        // Calcular resumo
        const faturasValidadas = allInvoices.filter(
          inv => inv.status === 'validated' || inv.status === 'approved'
        );
        const faturasPendentes = allInvoices.filter(inv => inv.status === 'pending');
        const faturasPagas = allInvoices.filter(inv => inv.status === 'paid');

        const totalAReceber = faturasValidadas.reduce((sum, inv) => sum + inv.total_value, 0);

        // Próximo pagamento: fatura validada com menor data de vencimento
        const proximaFatura = faturasValidadas
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

        // Faturas pagas no mês atual
        const hoje = new Date();
        const inicioMes = startOfMonth(hoje);
        const fimMes = endOfMonth(hoje);

        const pagosMes = faturasPagas.filter(inv => {
          if (!inv.payment_date) return false;
          const paymentDate = new Date(inv.payment_date);
          return paymentDate >= inicioMes && paymentDate <= fimMes;
        });

        const pagoMes = pagosMes.reduce((sum, inv) => sum + inv.total_value, 0);

        // Gerar histórico mensal dos últimos 6 meses
        const historicoMensal = [];
        for (let i = 0; i < 6; i++) {
          const monthDate = subMonths(hoje, i);
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);

          const monthPaidInvoices = faturasPagas.filter(inv => {
            if (!inv.payment_date) return false;
            const paymentDate = new Date(inv.payment_date);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          });

          const totalPago = monthPaidInvoices.reduce((sum, inv) => sum + inv.total_value, 0);

          historicoMensal.unshift({
            mes: format(monthDate, 'MMM/yyyy', { locale: ptBR }),
            totalPago,
            quantidadeFaturas: monthPaidInvoices.length,
          });
        }

        // Converter faturas para o formato do portal
        const portalInvoices: SupplierPortalInvoice[] = allInvoices.map(inv => {
          // Mapear status do backend para o portal
          let portalStatus: 'pendente' | 'validada' | 'paga' | 'cancelada' = 'pendente';
          if (inv.status === 'paid') portalStatus = 'paga';
          else if (inv.status === 'validated' || inv.status === 'approved') portalStatus = 'validada';
          else if (inv.status === 'cancelled') portalStatus = 'cancelada';

          // Mapear status de aprovação
          let statusAprovacao: 'aguardando' | 'aprovada' | 'rejeitada' | undefined;
          if (inv.status === 'pending') statusAprovacao = 'aguardando';
          else if (inv.status === 'validated' || inv.status === 'approved') statusAprovacao = 'aprovada';
          else if (inv.status === 'rejected') statusAprovacao = 'rejeitada';

          return {
            id: inv.id.toString(),
            invoice_number: inv.invoice_number,
            invoice_date: new Date(inv.invoice_date),
            due_date: new Date(inv.due_date),
            payment_date: inv.payment_date ? new Date(inv.payment_date) : undefined,
            total_value: inv.total_value,
            status: portalStatus,
            status_aprovacao: statusAprovacao,
            descricao: inv.description || `Fatura ${inv.invoice_number}`,
          };
        });

        const portalData: SupplierPortalData = {
          fornecedor: {
            id: supplier.id.toString(),
            nome: supplier.name,
            cnpj: supplier.cnpj,
            cpf: supplier.cpf,
            email: supplier.email,
            telefone: supplier.phone,
          },
          resumo: {
            totalAReceber,
            pendenteAprovacao: faturasPendentes.length,
            pagoMes,
            proximoPagamento: proximaFatura ? new Date(proximaFatura.due_date) : undefined,
            totalFaturas: allInvoices.length,
            faturasPendentes: faturasPendentes.length,
            faturasValidadas: faturasValidadas.length,
            faturasPagas: faturasPagas.length,
          },
          faturas: portalInvoices.sort((a, b) => b.invoice_date.getTime() - a.invoice_date.getTime()),
          historicoMensal,
        };

        console.log('📊 [useSupplierPortal] Dados do portal processados:', {
          fornecedor: portalData.fornecedor.nome,
          totalFaturas: portalData.resumo.totalFaturas,
          totalAReceber: portalData.resumo.totalAReceber,
        });

        setData(portalData);
        setIsValidToken(true);
      } catch (err: any) {
        console.error('❌ [useSupplierPortal] Erro ao buscar dados do portal:', err);
        setError(err.message || 'Erro ao carregar dados do portal');
        setIsValidToken(false);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortalData();
  }, [token]);

  return { data, isLoading, isValidToken, error };
};

// ===== Função para gerar acesso ao portal (conectada ao backend no futuro) =====

export const generateSupplierAccess = async (
  fornecedorId: string,
  fornecedorNome: string,
  dataExpiracao?: Date
): Promise<SupplierPortalAccess> => {
  // TODO: Quando tivermos endpoint de portal no backend, implementar aqui
  // Por enquanto, gera um token local baseado no ID do fornecedor

  console.log('🔄 [useSupplierPortal] Gerando acesso para fornecedor:', fornecedorNome);

  const token = `supplier-${fornecedorId}`;
  const access: SupplierPortalAccess = {
    id: `access-${Date.now()}`,
    fornecedorId,
    fornecedorNome,
    token,
    ativo: true,
    dataExpiracao,
    dataCriacao: new Date(),
    criadoPor: 'Admin User', // TODO: Pegar do contexto de autenticação
    criadoPorId: 'admin-001',
    acessosTotal: 0,
  };

  console.log('✅ [useSupplierPortal] Acesso gerado:', token);

  return Promise.resolve(access);
};

// ===== Função para revogar acesso ao portal =====

export const revokeSupplierAccess = async (accessId: string): Promise<boolean> => {
  // TODO: Quando tivermos endpoint de portal no backend, implementar aqui
  console.log('🔄 [useSupplierPortal] Revogando acesso:', accessId);

  // Simular sucesso
  return Promise.resolve(true);
};
