import { AuthTokens, ApiError } from '@/types';

// VERSÃO 5.0 - HTTPS ABSOLUTO
// Garantir que SEMPRE use HTTPS, não importa o que venha da env
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

// FUNÇÃO HELPER: Garantir HTTPS em qualquer URL
const forceHttps = (url: string): string => {
  if (!url) return 'https://orionback.roilabs.com.br/api/v1';

  // Se já é HTTPS, retorna como está
  if (url.startsWith('https://')) return url;

  // Se é HTTP, troca para HTTPS
  if (url.startsWith('http://')) return url.replace('http://', 'https://');

  // Se não tem protocolo, adiciona HTTPS
  if (!url.startsWith('http')) return `https://${url}`;

  return url;
};

// Aplicar forceHttps na URL da API
const API_URL = forceHttps(rawApiUrl || 'https://orionback.roilabs.com.br/api/v1');

// Debug detalhado
if (typeof window !== 'undefined') {
  console.log('═══════════════════════════════════════');
  console.log('🔧 API Configuration [v5.0 - HTTPS ABSOLUTE]');
  console.log('📝 Raw ENV:', rawApiUrl || '(undefined)');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('✅ Final URL:', API_URL);
  console.log('🔒 Protocol:', API_URL.startsWith('https:') ? 'HTTPS ✓' : 'HTTP ✗');
  console.log('═══════════════════════════════════════');
}

// Gerenciamento de tokens em memória (access_token) e localStorage (refresh_token)
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refresh_token', token);
  }
};

export const getRefreshToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
};

export const clearTokens = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refresh_token');
  }
};

// Função para fazer refresh do token
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const url = `${API_URL}/auth/refresh`.replace(/^http:/, 'https:');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data: AuthTokens = await response.json();
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    clearTokens();
    return null;
  }
}

// Cliente API com interceptor de autenticação
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers = {}, ...restOptions } = options;

  const config: RequestInit = {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  // Adicionar token de autenticação se necessário
  if (requiresAuth) {
    let token = getAccessToken();

    // Se não tiver token, tentar fazer refresh
    if (!token) {
      token = await refreshAccessToken();
    }

    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  // GARANTIR HTTPS - camada tripla de proteção
  let url = `${API_URL}${endpoint}`;
  url = url.replace(/^http:/, 'https:');

  if (typeof window !== 'undefined') {
    console.log('🌐 [v5.0] Request:', {
      endpoint,
      finalUrl: url,
      method: config.method || 'GET',
      protocol: url.startsWith('https:') ? 'HTTPS ✓' : 'HTTP ✗'
    });
  }

  try {
    // DEBUG: Log da URL exata que será passada ao fetch
    if (typeof window !== 'undefined') {
      console.log('🔍 [DEBUG] Calling fetch() with URL:', url);
      console.log('🔍 [DEBUG] URL object:', new URL(url));

      // TESTE RAW: Fetch direto SEM config para ver se o problema é no config
      console.log('🧪 [TEST] Fazendo fetch RAW sem config...');
      try {
        const testResponse = await fetch('https://orionback.roilabs.com.br/api/v1/cors-test');
        console.log('✅ [TEST] Fetch RAW funcionou!', testResponse.status);
      } catch (testError) {
        console.error('❌ [TEST] Fetch RAW FALHOU:', testError);
      }
    }

    const response = await fetch(url, config);

    // Se o token expirou, tentar fazer refresh e tentar novamente
    if (response.status === 401 && requiresAuth) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, config);

        if (!retryResponse.ok) {
          const error: ApiError = await retryResponse.json();
          throw new Error(error.detail || 'Request failed');
        }

        return retryResponse.json();
      } else {
        // Redirecionar para login se não conseguir fazer refresh
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.detail || 'Request failed');
    }

    return response.json();
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
}

// Funções auxiliares para métodos HTTP
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
