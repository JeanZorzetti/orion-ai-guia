import { AuthTokens, ApiError } from '@/types';

// VERSÃO 3.0 - FORÇAR HTTPS EM TUDO
// Garantir que SEMPRE use HTTPS, não importa o que venha da env
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const defaultUrl = 'https://orionback.roilabs.com.br/api/v1';

// Se a env estiver vazia ou undefined, usar default
let API_URL = rawApiUrl || defaultUrl;

// FORÇAR HTTP para HTTPS
API_URL = API_URL.replace(/^http:/, 'https:');

// Debug detalhado
if (typeof window !== 'undefined') {
  console.log('═══════════════════════════════════════');
  console.log('🔧 API Configuration [v3.0]');
  console.log('📝 Raw ENV:', rawApiUrl);
  console.log('✅ Final URL:', API_URL);
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
    console.log('🌐 [v3.0] Request:', {
      endpoint,
      finalUrl: url,
      method: config.method || 'GET'
    });
  }

  try {
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
