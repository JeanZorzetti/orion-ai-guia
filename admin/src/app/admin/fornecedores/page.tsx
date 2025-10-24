'use client';

import React, { useState, useEffect } from 'react';
import { supplierService } from '@/services/supplier';
import { Supplier } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
  Download,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '@/hooks/useConfirm';
import CreateSupplierModal from '@/components/supplier/CreateSupplierModal';
import EditSupplierModal from '@/components/supplier/EditSupplierModal';
import SupplierDetailsModal from '@/components/supplier/SupplierDetailsModal';
import { exportToCSV, formatDateForExport } from '@/lib/export';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar fornecedores');
      console.error('Erro ao carregar fornecedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditModalOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    await confirm(
      {
        title: 'Confirmar Exclusão',
        description: `Tem certeza que deseja excluir o fornecedor ${supplier.name}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        type: 'danger',
      },
      async () => {
        try {
          await supplierService.delete(supplier.id);
          toast.success('Fornecedor excluído com sucesso!');
          loadSuppliers();
        } catch (error) {
          console.error('Erro ao excluir fornecedor:', error);
          toast.error('Erro ao excluir fornecedor');
        }
      }
    );
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      searchTerm === '' ||
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.document?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && supplier.active) ||
      (activeFilter === 'inactive' && !supplier.active);

    return matchesSearch && matchesActive;
  });

  // Statistics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.active).length;
  const inactiveSuppliers = suppliers.filter((s) => !s.active).length;

  const formatDocument = (doc?: string) => {
    if (!doc) return '-';
    const cleaned = doc.replace(/\D/g, '');
    if (cleaned.length === 11) {
      // CPF: 000.000.000-00
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  const handleExport = () => {
    exportToCSV(
      filteredSuppliers,
      'fornecedores',
      [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Nome' },
        { key: 'document', label: 'Documento' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Telefone' },
        { key: 'address', label: 'Endereço' },
        { key: 'city', label: 'Cidade' },
        { key: 'state', label: 'Estado' },
        { key: 'zip_code', label: 'CEP' },
        { key: 'active', label: 'Ativo', format: (val) => (val ? 'Sim' : 'Não') },
        { key: 'created_at', label: 'Criado em', format: formatDateForExport },
      ]
    );
    toast.success(`${filteredSuppliers.length} fornecedor(es) exportado(s) com sucesso!`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500">Gerencie seus fornecedores e parceiros</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2"
            disabled={filteredSuppliers.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">Com status ativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Inativos</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inactiveSuppliers}</div>
            <p className="text-xs text-muted-foreground">Com status inativo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, documento ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={activeFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('all')}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={activeFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('active')}
                size="sm"
              >
                Ativos
              </Button>
              <Button
                variant={activeFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setActiveFilter('inactive')}
                size="sm"
              >
                Inativos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao carregar fornecedores"
          description={error}
          action={{
            label: "Tentar Novamente",
            onClick: loadSuppliers
          }}
        />
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhum fornecedor encontrado"
          description={
            searchTerm || activeFilter !== 'all'
              ? "Nenhum fornecedor corresponde aos filtros selecionados. Tente ajustar os filtros."
              : "Você ainda não cadastrou nenhum fornecedor. Comece criando seu primeiro fornecedor!"
          }
          action={
            !searchTerm && activeFilter === 'all'
              ? {
                  label: "Criar Primeiro Fornecedor",
                  onClick: () => setCreateModalOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Documento</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Telefone</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Cidade/UF</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {formatDocument(supplier.document)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{supplier.email || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{supplier.phone || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {supplier.city && supplier.state
                          ? `${supplier.city}/${supplier.state}`
                          : supplier.city || supplier.state || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={supplier.active ? 'default' : 'secondary'}>
                          {supplier.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(supplier)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(supplier)}
                            title="Editar"
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(supplier)}
                            title="Excluir"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Modals */}
      <CreateSupplierModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadSuppliers}
      />

      <EditSupplierModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        supplier={selectedSupplier}
        onSuccess={loadSuppliers}
      />

      <SupplierDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        supplier={selectedSupplier}
        onEdit={() => {
          setDetailsModalOpen(false);
          setEditModalOpen(true);
        }}
        onDelete={() => {
          setDetailsModalOpen(false);
          if (selectedSupplier) {
            handleDelete(selectedSupplier);
          }
        }}
      />

      {ConfirmDialog}
    </div>
  );
}
