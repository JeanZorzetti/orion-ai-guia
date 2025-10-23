'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { superAdminService } from '@/services/superAdmin';
import { SystemStats } from '@/types';
import {
  Building2,
  Users,
  FileText,
  Package,
  Shield,
  TrendingUp
} from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado e é super admin
    const checkAuth = async () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          router.push('/login');
          return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'super_admin') {
          router.push('/admin/dashboard');
          return;
        }

        // Carregar estatísticas
        const data = await superAdminService.getStats();
        setStats(data);
      } catch (err: any) {
        console.error('Erro ao carregar estatísticas:', err);
        if (err.message?.includes('403') || err.message?.includes('401')) {
          router.push('/admin/dashboard');
        } else {
          setError('Erro ao carregar estatísticas');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-purple-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do sistema Orion ERP
          </p>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.total_workspaces || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.active_workspaces || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.active_users || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.total_invoices || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              No sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.total_products || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Ativação</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {stats && stats.total_workspaces > 0
                ? Math.round((stats.active_workspaces / stats.total_workspaces) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Workspaces ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários por Workspace</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {stats && stats.total_workspaces > 0
                ? (stats.total_users / stats.total_workspaces).toFixed(1)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Gerenciamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/super-admin/workspaces')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Gerenciar Workspaces</h3>
                  <p className="text-sm text-muted-foreground">
                    Criar, editar e desativar workspaces de clientes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/super-admin/usuarios')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Gerenciar Usuários</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualizar, criar e editar usuários de todos os workspaces
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
