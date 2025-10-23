import { api } from '@/lib/api';
import { WorkspaceAdmin, UserAdmin, SystemStats } from '@/types';

// ==================== STATISTICS ====================

export const superAdminService = {
  // Statistics
  async getStats(): Promise<SystemStats> {
    return api.get<SystemStats>('/super-admin/stats');
  },

  // Workspaces
  async getWorkspaces(): Promise<WorkspaceAdmin[]> {
    return api.get<WorkspaceAdmin[]>('/super-admin/workspaces');
  },

  async getWorkspace(id: number): Promise<WorkspaceAdmin> {
    return api.get<WorkspaceAdmin>(`/super-admin/workspaces/${id}`);
  },

  async createWorkspace(data: { name: string; active?: boolean }): Promise<WorkspaceAdmin> {
    return api.post<WorkspaceAdmin>('/super-admin/workspaces', data);
  },

  async updateWorkspace(id: number, data: { name?: string; active?: boolean }): Promise<WorkspaceAdmin> {
    return api.patch<WorkspaceAdmin>(`/super-admin/workspaces/${id}`, data);
  },

  async deleteWorkspace(id: number): Promise<void> {
    return api.delete(`/super-admin/workspaces/${id}`);
  },

  // Users
  async getUsers(workspaceId?: number): Promise<UserAdmin[]> {
    const query = workspaceId ? `?workspace_id=${workspaceId}` : '';
    return api.get<UserAdmin[]>(`/super-admin/users${query}`);
  },

  async getUser(id: number): Promise<UserAdmin> {
    return api.get<UserAdmin>(`/super-admin/users/${id}`);
  },

  async createUser(data: {
    email: string;
    full_name: string;
    password: string;
    role: string;
    workspace_id: number;
    active?: boolean;
  }): Promise<UserAdmin> {
    return api.post<UserAdmin>('/super-admin/users', data);
  },

  async updateUser(id: number, data: {
    email?: string;
    full_name?: string;
    role?: string;
    active?: boolean;
    workspace_id?: number;
  }): Promise<UserAdmin> {
    return api.patch<UserAdmin>(`/super-admin/users/${id}`, data);
  },

  async deleteUser(id: number): Promise<void> {
    return api.delete(`/super-admin/users/${id}`);
  },
};
