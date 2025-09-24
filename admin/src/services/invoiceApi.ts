import { API_URLS, ENVIRONMENT_INFO } from '@/lib/config';

export interface APIInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface APIInvoiceData {
  supplier: {
    name: string;
    document?: string;
    address?: string;
  };
  invoice: {
    number: string;
    date: string;
    dueDate?: string;
    category?: string;
  };
  financial: {
    totalValue: number;
    netValue: number;
    taxValue: number;
  };
  items: APIInvoiceItem[];
  metadata?: {
    confidence: number;
    processingTime: number;
    detectedLanguage: string;
  };
}

export interface UploadResponse {
  success: boolean;
  data?: {
    id: string;
    filename: string;
    extractedData: APIInvoiceData;
    validationIssues?: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SaveInvoiceRequest {
  supplier: string;
  supplierDocument?: string;
  supplierAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalValue: number;
  taxValue?: number;
  netValue?: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
  category?: string;
  paymentMethod?: string;
}

export interface SaveInvoiceResponse {
  success: boolean;
  data?: {
    id: string;
    invoiceNumber: string;
    status: 'draft' | 'validated' | 'approved' | 'paid';
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class InvoiceApiService {
  private baseUrl = `${ENVIRONMENT_INFO.baseUrl}/api/v1/financials`;

  async uploadInvoice(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/invoices/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || `HTTP Error: ${response.status}`,
            details: data
          }
        };
      }

      return {
        success: true,
        data: {
          id: data.id,
          filename: file.name,
          extractedData: data.extractedData,
          validationIssues: data.validationIssues || []
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
          details: error
        }
      };
    }
  }

  async saveInvoice(invoiceData: SaveInvoiceRequest): Promise<SaveInvoiceResponse> {
    console.log('🚀 Saving invoice data to API:', {
      endpoint: `${this.baseUrl}/invoices`,
      method: 'POST',
      supplier: invoiceData.supplier,
      invoiceNumber: invoiceData.invoiceNumber,
      totalValue: invoiceData.totalValue,
      itemsCount: invoiceData.items.length
    });

    try {
      const response = await fetch(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📥 API Response data:', data);

      if (!response.ok) {
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        });

        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || `HTTP Error: ${response.status}`,
            details: data
          }
        };
      }

      console.log('✅ Invoice saved successfully:', {
        id: data.id,
        invoiceNumber: data.invoiceNumber,
        status: data.status
      });

      return {
        success: true,
        data: {
          id: data.id,
          invoiceNumber: data.invoiceNumber,
          status: data.status
        }
      };

    } catch (error) {
      console.error('🚫 Network error saving invoice:', error);

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede',
          details: error
        }
      };
    }
  }

  async getInvoices(): Promise<{
    success: boolean;
    data?: SaveInvoiceRequest[];
    error?: { code: string; message: string };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/invoices`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: response.status.toString(),
            message: data.message || `HTTP Error: ${response.status}`
          }
        };
      }

      return {
        success: true,
        data: data.invoices || []
      };

    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Erro de rede'
        }
      };
    }
  }
}

export const invoiceApi = new InvoiceApiService();