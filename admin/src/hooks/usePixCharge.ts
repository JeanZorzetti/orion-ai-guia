'use client';

import { useState, useEffect } from 'react';

export interface PixCharge {
  id: string;
  contaReceberId: string;
  txid: string;
  qrCode: string;
  qrCodeBase64: string;
  valor: number;
  status: 'ativo' | 'concluido' | 'removido_pelo_usuario_recebedor' | 'expirado';
  dataExpiracao: Date;
  dataCriacao: Date;
  pagador?: {
    nome: string;
    cpfCnpj: string;
    dataPagamento?: Date;
  };
}

interface UsePixChargeReturn {
  charge: PixCharge | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generateCharge: (contaReceberId: string, valor: number) => Promise<void>;
  checkStatus: () => Promise<void>;
  cancelCharge: () => Promise<void>;
}

// Mock data para demonstração
const mockPixCharges: Record<string, PixCharge> = {};

export function usePixCharge(contaReceberId?: string): UsePixChargeReturn {
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contaReceberId && mockPixCharges[contaReceberId]) {
      setCharge(mockPixCharges[contaReceberId]);
    }
  }, [contaReceberId]);

  const generateCharge = async (contaId: string, valor: number) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulação de chamada API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const txid = `PIX${Date.now()}${Math.random().toString(36).substring(7)}`;
      const qrCodeString = `00020126580014br.gov.bcb.pix0136${txid}520400005303986540${valor.toFixed(2)}5802BR5925NOME DA SUA EMPRESA LTDA6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newCharge: PixCharge = {
        id: Date.now().toString(),
        contaReceberId: contaId,
        txid,
        qrCode: qrCodeString,
        qrCodeBase64: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`, // Placeholder
        valor,
        status: 'ativo',
        dataExpiracao: new Date(Date.now() + 3600 * 1000), // 1 hora
        dataCriacao: new Date(),
      };

      mockPixCharges[contaId] = newCharge;
      setCharge(newCharge);
    } catch (err) {
      setError('Erro ao gerar cobrança PIX');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const checkStatus = async () => {
    if (!charge) return;

    setIsLoading(true);
    try {
      // Simulação de verificação de status via API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simular mudança de status aleatória (para demo)
      const random = Math.random();
      if (random > 0.7) {
        const updatedCharge = {
          ...charge,
          status: 'concluido' as const,
          pagador: {
            nome: 'João da Silva',
            cpfCnpj: '123.456.789-00',
            dataPagamento: new Date(),
          },
        };
        mockPixCharges[charge.contaReceberId] = updatedCharge;
        setCharge(updatedCharge);
      } else if (new Date() > charge.dataExpiracao) {
        const updatedCharge = {
          ...charge,
          status: 'expirado' as const,
        };
        mockPixCharges[charge.contaReceberId] = updatedCharge;
        setCharge(updatedCharge);
      }
    } catch (err) {
      setError('Erro ao verificar status');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelCharge = async () => {
    if (!charge) return;

    setIsLoading(true);
    try {
      // Simulação de cancelamento via API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updatedCharge = {
        ...charge,
        status: 'removido_pelo_usuario_recebedor' as const,
      };
      mockPixCharges[charge.contaReceberId] = updatedCharge;
      setCharge(updatedCharge);
    } catch (err) {
      setError('Erro ao cancelar cobrança');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    charge,
    isLoading,
    isGenerating,
    error,
    generateCharge,
    checkStatus,
    cancelCharge,
  };
}
