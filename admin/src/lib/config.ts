// Orion ERP - Configuração de Ambiente

interface ApiConfig {
  baseUrl: string;
  endpoints: {
    auth: string;
    users: string;
    dashboard: string;
    financials: string;
    suppliers: string;
  };
}

interface EnvironmentConfig {
  development: ApiConfig;
  production: ApiConfig;
  staging?: ApiConfig;
}

// Detecção automática do ambiente
const getEnvironment = (): 'development' | 'production' | 'staging' => {
  // Se estiver rodando no localhost, é desenvolvimento
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }

    if (hostname.includes('staging') || hostname.includes('dev')) {
      return 'staging';
    }
  }

  // Se NODE_ENV estiver definido, usar ele
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  if (process.env.NODE_ENV === 'development') {
    return 'development';
  }

  // Default para desenvolvimento
  return 'development';
};

// Helper para forçar HTTPS em produção
const ensureHttps = (url: string, isProd: boolean): string => {
  if (isProd && url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  return url;
};

// Configurações por ambiente
const environments: EnvironmentConfig = {
  development: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      financials: '/api/v1/financials',
      suppliers: '/api/v1/suppliers'
    }
  },

  production: {
    baseUrl: ensureHttps(
      process.env.NEXT_PUBLIC_API_URL || 'https://orionback.roilabs.com.br',
      true
    ),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      financials: '/api/v1/financials',
      suppliers: '/api/v1/suppliers'
    }
  },

  staging: {
    baseUrl: ensureHttps(
      process.env.NEXT_PUBLIC_API_URL || 'https://staging-orionback.roilabs.com.br',
      true
    ),
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      dashboard: '/api/v1/dashboard',
      financials: '/api/v1/financials',
      suppliers: '/api/v1/suppliers'
    }
  }
};

// Configuração ativa baseada no ambiente
const currentEnvironment = getEnvironment();
export const apiConfig = environments[currentEnvironment];

// Validação de configuração
if (!apiConfig) {
  throw new Error(`Configuração não encontrada para o ambiente: ${currentEnvironment}`);
}

// URLs completas dos endpoints
export const API_URLS = {
  AUTH: {
    LOGIN: `${apiConfig.baseUrl}${apiConfig.endpoints.auth}/login`,
    LOGOUT: `${apiConfig.baseUrl}${apiConfig.endpoints.auth}/logout`,
    ME: `${apiConfig.baseUrl}${apiConfig.endpoints.auth}/me`,
  },

  USERS: {
    LIST: `${apiConfig.baseUrl}${apiConfig.endpoints.users}`,
    CREATE: `${apiConfig.baseUrl}${apiConfig.endpoints.users}`,
    GET: (id: number) => `${apiConfig.baseUrl}${apiConfig.endpoints.users}/${id}`,
  },

  DASHBOARD: {
    DATA: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard}`,
  },

  FINANCIALS: {
    UPLOAD_INVOICE: `${apiConfig.baseUrl}${apiConfig.endpoints.financials}/invoices/upload`,
    SAVE_INVOICE: `${apiConfig.baseUrl}${apiConfig.endpoints.financials}/invoices`,
    LIST_INVOICES: `${apiConfig.baseUrl}${apiConfig.endpoints.financials}/invoices`,
    TEST_CLEANING: `${apiConfig.baseUrl}${apiConfig.endpoints.financials}/test-data-cleaning`,
  },

  SUPPLIERS: {
    SEARCH: `${apiConfig.baseUrl}${apiConfig.endpoints.suppliers}/search`,
    CREATE_OR_MERGE: `${apiConfig.baseUrl}${apiConfig.endpoints.suppliers}/create-or-merge`,
    LIST: `${apiConfig.baseUrl}${apiConfig.endpoints.suppliers}/list`,
    STATISTICS: `${apiConfig.baseUrl}${apiConfig.endpoints.suppliers}/statistics`,
    GET: (id: number) => `${apiConfig.baseUrl}${apiConfig.endpoints.suppliers}/${id}`,
  }
};

// Informações do ambiente atual
export const ENVIRONMENT_INFO = {
  current: currentEnvironment,
  baseUrl: apiConfig.baseUrl,
  isProduction: currentEnvironment === 'production',
  isDevelopment: currentEnvironment === 'development',
  isStaging: currentEnvironment === 'staging'
};

// Log das configurações (apenas em desenvolvimento)
if (ENVIRONMENT_INFO.isDevelopment && typeof window !== 'undefined') {
  console.log('🌍 Orion ERP - Environment Config:', {
    environment: currentEnvironment,
    baseUrl: apiConfig.baseUrl,
    hostname: window.location.hostname
  });
}