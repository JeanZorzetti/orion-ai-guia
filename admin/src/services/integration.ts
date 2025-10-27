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
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
      throw new Error(error.detail || `Erro HTTP ${response.status}`);
    }

    return response.json();
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

    return this.handleResponse(response);
  }

  async getShopifyConfig(): Promise<ShopifyConfigResponse> {
    const response = await fetch(`${API_URL}/integrations/shopify/config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async testShopifyConnection(): Promise<ShopifyConnectionTest> {
    const response = await fetch(`${API_URL}/integrations/shopify/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async syncShopifyOrders(limit: number = 250): Promise<ShopifySyncResult> {
    const response = await fetch(`${API_URL}/integrations/shopify/sync-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit }),
    });

    return this.handleResponse(response);
  }

  async deleteShopifyConfig(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/shopify/config`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // MERCADO LIVRE
  // ============================================================================

  async getMercadoLivreAuthUrl(): Promise<{ auth_url: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/auth-url`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async connectMercadoLivre(code: string): Promise<{ success: boolean; message: string; user_id: string; nickname: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/callback`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code }),
    });

    return this.handleResponse(response);
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

    return this.handleResponse(response);
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

    return this.handleResponse(response);
  }

  async syncMercadoLivreOrders(limit: number = 50): Promise<ShopifySyncResult> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/sync-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit }),
    });

    return this.handleResponse(response);
  }

  async deleteMercadoLivreConfig(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/mercadolivre/config`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // WOOCOMMERCE METHODS
  // ============================================================================

  async saveWooCommerceConfig(
    store_url: string,
    consumer_key: string,
    consumer_secret: string
  ): Promise<{ success: boolean; message: string; store_url: string }> {
    const response = await fetch(`${API_URL}/integrations/woocommerce/config`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ store_url, consumer_key, consumer_secret }),
    });

    return this.handleResponse(response);
  }

  async getWooCommerceConfig(): Promise<{
    connected: boolean;
    store_url: string | null;
    last_sync: string | null;
  }> {
    const response = await fetch(`${API_URL}/integrations/woocommerce/config`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async testWooCommerceConnection(): Promise<{
    success: boolean;
    message: string;
    store_name?: string;
    wc_version?: string;
  }> {
    const response = await fetch(`${API_URL}/integrations/woocommerce/test-connection`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }

  async syncWooCommerceOrders(limit: number = 50): Promise<ShopifySyncResult> {
    const response = await fetch(`${API_URL}/integrations/woocommerce/sync-orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ limit }),
    });

    return this.handleResponse(response);
  }

  async deleteWooCommerceConfig(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/integrations/woocommerce/config`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse(response);
  }
}

export const integrationService = new IntegrationService();
