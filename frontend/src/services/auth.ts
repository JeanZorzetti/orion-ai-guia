import { api, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api';
import { LoginCredentials, RegisterData, AuthTokens, User } from '@/types';

export const authService = {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>(
      '/auth/token',
      credentials,
      { requiresAuth: false }
    );

    // Armazenar tokens
    setAccessToken(response.access_token);
    setRefreshToken(response.refresh_token);

    return response;
  },

  // Registro
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/users', data, { requiresAuth: false });
    return response;
  },

  // Obter usuário atual
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response;
  },

  // Logout
  logout() {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token') !== null;
    }
    return false;
  },
};
