import { AuthTokens, ApiError } from '@/types';

// VERSÃO 6.0 - HTTPS ABSOLUTO ULTRA FORÇADO
// Garantir que SEMPRE use HTTPS, não importa o que venha da env
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

// FUNÇÃO HELPER: Garantir HTTPS em qualquer URL - ULTRA PROTEÇÃO
const forceHttps = (url: string): string => {
  if (!url) return 'https://orionback.roilabs.com.br/api/v1';

  // Limpar qualquer protocolo existente e forçar HTTPS
  let cleanUrl = url.replace(/^https?:\/\//, ''); // Remove http:// ou https://

  // Se ainda tem algo suspeito, limpar mais
  cleanUrl = cleanUrl.replace(/^\/\//, ''); // Remove // inicial

  // Garantir que sempre inicia com https://
  return `https://${cleanUrl}`;
};

// Aplicar forceHttps na URL da API - DUAS CAMADAS DE PROTEÇÃO
let API_URL = forceHttps(rawApiUrl || 'https://orionback.roilabs.com.br/api/v1');

// CAMADA EXTRA: Se por algum motivo ainda não for HTTPS, forçar novamente
if (!API_URL.startsWith('https://')) {
  console.error('⚠️ ALERTA: URL não é HTTPS, forçando conversão!');
  API_URL = API_URL.replace(/^http:/, 'https:');
}

// Debug detalhado
if (typeof window !== 'undefined') {
  console.log('═══════════════════════════════════════');
  console.log('🔧 API Configuration [v6.0 - HTTPS ULTRA FORCED]');
  console.log('📝 Raw ENV:', rawApiUrl || '(undefined)');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('✅ Final URL:', API_URL);
  console.log('🔒 Protocol:', API_URL.startsWith('https:') ? 'HTTPS ✓' : 'HTTP ✗');
  console.log('⚠️  Mixed Content:', API_URL.startsWith('https:') ? 'PROTECTED ✓' : 'VULNERABLE ✗');
  console.log('═══════════════════════════════════════');
}

// Gerenciamento de tokens em memória (access_token) e localStorage (refresh_token)
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
  // WORKAROUND: Também salvar no localStorage para persistir entre navegações
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', token);
  }
};

export const getAccessToken = () => {
  // Se não está em memória, tentar buscar do localStorage
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token');
  }
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
    localStorage.removeItem('access_token');
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
  responseType?: 'json' | 'blob';
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, responseType = 'json', headers = {}, ...restOptions } = options;

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

  // Remover barras duplas que podem aparecer na junção
  url = url.replace(/([^:]\/)\/+/g, '$1');

  // CAMADA DE PROTEÇÃO MÁXIMA: Forçar HTTPS SEMPRE
  // Se começar com http:// trocar para https://
  if (url.startsWith('http://')) {
    console.warn('⚠️ ALERTA: URL estava usando HTTP, forçando HTTPS!', url);
    url = url.replace(/^http:\/\//, 'https://');
  }

  // Se não tiver protocolo, adicionar https://
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    console.warn('⚠️ ALERTA: URL sem protocolo, adicionando HTTPS!', url);
    url = `https://${url}`;
  }

  // Última verificação: se ainda estiver com http://, erro crítico
  if (url.startsWith('http://')) {
    console.error('🚨 ERRO CRÍTICO: URL ainda está com HTTP após todas as correções!', url);
    throw new Error('Mixed Content: Cannot use HTTP in HTTPS context');
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

        return responseType === 'blob' ? (retryResponse.blob() as unknown as T) : retryResponse.json();
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

    return responseType === 'blob' ? (response.blob() as unknown as T) : response.json();
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
