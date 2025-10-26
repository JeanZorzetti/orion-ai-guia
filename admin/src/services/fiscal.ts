// Serviço para integração com API fiscal

import type {
  FiscalConfig,
  FiscalConfigResponse,
  IssueNFeResponse,
  CancelNFeResponse,
  NFEStatusResponse,
} from '@/types/fiscal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class FiscalService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Busca configurações fiscais do workspace
   */
  async getConfig(): Promise<FiscalConfigResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/fiscal/workspaces/config/fiscal`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao buscar configurações fiscais');
    }

    return response.json();
  }

  /**
   * Atualiza configurações fiscais do workspace
   */
  async updateConfig(config: FiscalConfig): Promise<{ success: boolean; message: string }> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/fiscal/workspaces/config/fiscal`, {
      method: 'POST',
      headers,
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao salvar configurações fiscais');
    }

    return response.json();
  }

  /**
   * Emite uma NF-e para uma venda
   */
  async issueNFe(saleId: number): Promise<IssueNFeResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/fiscal/sales/${saleId}/issue-nfe`, {
      method: 'POST',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Erro ao emitir NF-e');
    }

    return data;
  }

  /**
   * Cancela uma NF-e já emitida
   */
  async cancelNFe(saleId: number, reason: string): Promise<CancelNFeResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/fiscal/sales/${saleId}/cancel-nfe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || 'Erro ao cancelar NF-e');
    }

    return data;
  }

  /**
   * Busca status de uma NF-e
   */
  async getNFeStatus(saleId: number): Promise<NFEStatusResponse> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${API_URL}/api/v1/fiscal/sales/${saleId}/nfe-status`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao buscar status da NF-e');
    }

    return response.json();
  }

  /**
   * Faz upload do certificado digital A1
   */
  async uploadCertificate(formData: FormData): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/api/v1/fiscal/workspaces/certificate/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao fazer upload do certificado');
    }

    return response.json();
  }

  /**
   * Valida um CNPJ
   */
  validateCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanCNPJ.length !== 14) return false;

    // Valida dígitos verificadores
    let size = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, size);
    const digits = cleanCNPJ.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleanCNPJ.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  }

  /**
   * Formata CNPJ para exibição
   */
  formatCNPJ(cnpj: string): string {
    const clean = cnpj.replace(/[^\d]/g, '');
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  /**
   * Formata CEP para exibição
   */
  formatCEP(cep: string): string {
    const clean = cep.replace(/[^\d]/g, '');
    return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  }
}

export const fiscalService = new FiscalService();
