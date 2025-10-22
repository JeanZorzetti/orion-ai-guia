'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { Card, Badge } from '@/components/ui';
import { authService } from '@/services/auth';
import { User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push('/login');
          return;
        }

        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--muted)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bem-vindo de volta, {user?.full_name}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Fornecedores</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Notas Fiscais</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Produtos</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Vendas</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">0</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </Card>
        </div>

        <Card title="Status do Sistema" padding="md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backend API</span>
              <Badge variant="success">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Banco de Dados</span>
              <Badge variant="success">Conectado</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Autenticação</span>
              <Badge variant="success">Ativa</Badge>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
