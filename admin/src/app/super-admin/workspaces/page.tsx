'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { superAdminService } from '@/services/superAdmin';
import { WorkspaceAdmin } from '@/types';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  Search
} from 'lucide-react';

const WorkspacesPage: React.FC = () => {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await superAdminService.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este workspace?')) return;

    try {
      await superAdminService.deleteWorkspace(id);
      setWorkspaces(workspaces.filter(w => w.id !== id));
      alert('Workspace excluído com sucesso!');
    } catch (error: any) {
      alert(error.message || 'Erro ao excluir workspace');
    }
  };

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-500" />
            Workspaces
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar workspaces de clientes
          </p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Novo Workspace
        </Button>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar workspace..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaces.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workspaces.filter(w => w.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {workspaces.reduce((sum, w) => sum + w.user_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Workspaces */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Workspaces ({filteredWorkspaces.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold text-sm">ID</th>
                  <th className="text-left p-3 font-semibold text-sm">Nome</th>
                  <th className="text-center p-3 font-semibold text-sm">Usuários</th>
                  <th className="text-left p-3 font-semibold text-sm">Criado em</th>
                  <th className="text-center p-3 font-semibold text-sm">Status</th>
                  <th className="text-center p-3 font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkspaces.map((workspace) => (
                  <tr key={workspace.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <span className="font-mono text-sm">#{workspace.id}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{workspace.name}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-semibold">{workspace.user_count}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(workspace.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {workspace.active ? (
                        <Badge className="bg-green-500">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(workspace.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkspacesPage;
