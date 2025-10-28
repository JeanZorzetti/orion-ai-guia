'use client';

import { useState, useEffect } from 'react';

export interface Boleto {
  id: string;
  contaReceberId: string;
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  urlPdf: string;
  dataVencimento: Date;
  dataEmissao: Date;
  valor: number;
  valorPago?: number;
  multa: number; // percentual
  juros: number; // percentual ao dia
  desconto?: number;
  status: 'registrado' | 'pago' | 'cancelado' | 'vencido';
  instrucoes?: string;
  pagador?: {
    nome: string;
    cpfCnpj: string;
    dataPagamento?: Date;
  };
}

interface UseBoletoReturn {
  boleto: Boleto | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateBoleto: (params: GenerateBoletoParams) => Promise<void>;
  checkStatus: () => Promise<void>;
  cancelBoleto: () => Promise<void>;
  downloadPdf: () => void;
}

interface GenerateBoletoParams {
  contaReceberId: string;
  valor: number;
  vencimento: Date;
  multa?: number;
  juros?: number;
  desconto?: number;
  instrucoes?: string;
}

// Mock data para demonstração
const mockBoletos: Record<string, Boleto> = {};

export function useBoleto(contaReceberId?: string): UseBoletoReturn {
  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contaReceberId && mockBoletos[contaReceberId]) {
      setBoleto(mockBoletos[contaReceberId]);
    }
  }, [contaReceberId]);

  const generateBoleto = async (params: GenerateBoletoParams) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulação de chamada API
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const nossoNumero = `${Date.now().toString().substring(5)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      const codigoBarras = `34191${nossoNumero}000${params.valor.toFixed(2).replace('.', '')}`;
      const linhaDigitavel = formatLinhaDigitavel(codigoBarras);

      const newBoleto: Boleto = {
        id: Date.now().toString(),
        contaReceberId: params.contaReceberId,
        nossoNumero,
        linhaDigitavel,
        codigoBarras,
        urlPdf: `/api/boletos/${nossoNumero}/pdf`, // Mock URL
        dataVencimento: params.vencimento,
        dataEmissao: new Date(),
        valor: params.valor,
        multa: params.multa || 2, // 2% padrão
        juros: params.juros || 0.033, // 1% ao mês = 0.033% ao dia
        desconto: params.desconto,
        status: 'registrado',
        instrucoes: params.instrucoes,
      };

      mockBoletos[params.contaReceberId] = newBoleto;
      setBoleto(newBoleto);
    } catch (err) {
      setError('Erro ao gerar boleto');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkStatus = async () => {
    if (!boleto) return;

    setIsLoading(true);
    try {
      // Simulação de verificação de status via API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular mudança de status aleatória (para demo)
      const random = Math.random();
      if (random > 0.8) {
        const updatedBoleto = {
          ...boleto,
          status: 'pago' as const,
          valorPago: boleto.valor,
          pagador: {
            nome: 'Maria Oliveira',
            cpfCnpj: '987.654.321-00',
            dataPagamento: new Date(),
          },
        };
        mockBoletos[boleto.contaReceberId] = updatedBoleto;
        setBoleto(updatedBoleto);
      } else if (new Date() > boleto.dataVencimento && boleto.status === 'registrado') {
        const updatedBoleto = {
          ...boleto,
          status: 'vencido' as const,
        };
        mockBoletos[boleto.contaReceberId] = updatedBoleto;
        setBoleto(updatedBoleto);
      }
    } catch (err) {
      setError('Erro ao verificar status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBoleto = async () => {
    if (!boleto) return;

    setIsLoading(true);
    try {
      // Simulação de cancelamento via API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedBoleto = {
        ...boleto,
        status: 'cancelado' as const,
      };
      mockBoletos[boleto.contaReceberId] = updatedBoleto;
      setBoleto(updatedBoleto);
    } catch (err) {
      setError('Erro ao cancelar boleto');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!boleto) return;

    // Simulação de download
    console.log('Downloading PDF:', boleto.urlPdf);
    window.open(boleto.urlPdf, '_blank');
  };

  return {
    boleto,
    isLoading,
    isGenerating,
    error,
    generateBoleto,
    checkStatus,
    cancelBoleto,
    downloadPdf,
  };
}

// Função auxiliar para formatar linha digitável
function formatLinhaDigitavel(codigoBarras: string): string {
  // Simplificação - em produção usar algoritmo correto
  const parts = [
    codigoBarras.substring(0, 5),
    codigoBarras.substring(5, 10),
    codigoBarras.substring(10, 15),
    codigoBarras.substring(15, 21),
    codigoBarras.substring(21, 26),
    codigoBarras.substring(26, 32),
    codigoBarras.substring(32, 33),
    codigoBarras.substring(33, 47),
  ];

  return `${parts[0]}.${parts[1]} ${parts[2]}.${parts[3]} ${parts[4]}.${parts[5]} ${parts[6]} ${parts[7]}`;
}
