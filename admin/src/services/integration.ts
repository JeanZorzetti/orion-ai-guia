/**
 * Serviço de Integração com Canais de Venda (Shopify, Mercado Livre, etc.)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ShopifyConfig {
  store_url: string;
  api_key: string;
}

export interface ShopifyConfigResponse {
  store_url?: string;
  last_sync?: string;
  has_api_key: boolean;
}

export interface ShopifySyncResult {
  success: boolean;
  new_orders_imported: number;
  skipped_orders: number;
  errors: string[];
  message: string;
}

export interface ShopifyConnectionTest {
  success: boolean;
  message?: string;
  shop_name?: string;
  shop_domain?: string;
  error?: string;
}

class IntegrationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ============================================================================
  // SHOPIFY
  // ============================================================================

  async saveShopifyConfig(config: ShopifyConfig): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/shopify/config`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao salvar configurações Shopify');
    }

    return response.json();
  }

  async getShopifyConfig(): Promise<ShopifyConfigResponse> {
    const response = await fetch(`${API_URL}/integrations/shopify/config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao buscar configurações Shopify');
    }

    return response.json();
  }

  async testShopifyConnection(): Promise<ShopifyConnectionTest> {
    const response = await fetch(`${API_URL}/integrations/shopify/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao testar conexão Shopify');
    }

    return response.json();
  }

  async syncShopifyOrders(limit: number = 250): Promise<ShopifySyncResult> {
    const response = await fetch(`${API_URL}/integrations/shopify/sync-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao sincronizar pedidos Shopify');
    }

    return response.json();
  }

  async deleteShopifyConfig(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/shopify/config`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao remover integração Shopify');
    }

    return response.json();
  }

  // ============================================================================
  // MERCADO LIVRE
  // ============================================================================

  async getMercadoLivreAuthUrl(): Promise<{ auth_url: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/auth-url`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao obter URL de autorização ML');
    }

    return response.json();
  }

  async connectMercadoLivre(code: string): Promise<{ success: boolean; message: string; user_id: string; nickname: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/callback`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao conectar Mercado Livre');
    }

    return response.json();
  }

  async getMercadoLivreConfig(): Promise<{
    user_id?: string;
    nickname?: string;
    last_sync?: string;
    has_token: boolean;
    token_expires_at?: string;
  }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao buscar configurações Mercado Livre');
    }

    return response.json();
  }

  async testMercadoLivreConnection(): Promise<{
    success: boolean;
    message?: string;
    user_id?: string;
    nickname?: string;
    error?: string;
  }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao testar conexão Mercado Livre');
    }

    return response.json();
  }

  async syncMercadoLivreOrders(limit: number = 50): Promise<ShopifySyncResult> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/sync-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao sincronizar pedidos Mercado Livre');
    }

    return response.json();
  }

  async deleteMercadoLivreConfig(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/config`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao remover integração Mercado Livre');
    }

    return response.json();
  }
}

export const integrationService = new IntegrationService();
