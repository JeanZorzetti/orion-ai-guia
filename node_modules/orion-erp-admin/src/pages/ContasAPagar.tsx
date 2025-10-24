'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
import { Input } from '../../src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../src/components/ui/table';
import InvoiceUploadModal from '../../src/components/invoice/InvoiceUploadModal';
import { CreateInvoiceModal } from '../../src/components/invoice/CreateInvoiceModal';
import { EditInvoiceModal } from '../../src/components/invoice/EditInvoiceModal';
import { InvoiceDetailsModal } from '../../src/components/invoice/InvoiceDetailsModal';
import { useConfirm } from '@/hooks/useConfirm';
import {
  Upload,
  Edit,
  Trash2,
  Filter,
  Plus,
  Eye,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { invoiceService } from '../services/invoice';
import { supplierService } from '../services/supplier';
import { Invoice, Supplier } from '../types';
import { toast } from 'sonner';
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from '@/lib/export';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { usePrint } from '@/hooks/usePrint';
import { PrintButton } from '@/components/ui/print-button';
import { PrintLayout, NoPrint, PrintOnly, PrintInfoGrid } from '@/components/ui/print-layout';

type StatusFilter = 'pending' | 'validated' | 'paid' | 'cancelled' | 'all';

type SortField = 'invoice_number' | 'invoice_date' | 'due_date' | 'total_value' | 'status';
type SortOrder = 'asc' | 'desc';

const ContasAPagar: React.FC = () => {
  const [filtroAtivo, setFiltroAtivo] = useState<StatusFilter>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados de ordenação
  const [sortField, setSortField] = useState<SortField>('invoice_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Estados dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  // Hook de impressão
  const { isPrinting, handlePrint } = usePrint({
    documentTitle: 'Relatório de Faturas - Orion ERP',
  });

  useEffect(() => {
    loadInvoices();
    loadSuppliers();
  }, [filtroAtivo]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getAll({
        status_filter: filtroAtivo === 'all' ? undefined : filtroAtivo,
        limit: 1000
      });
      setInvoices(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err);
    }
  };

  // Filtrar e ordenar faturas
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = [...invoices];

    // Filtro por busca (número da fatura)
    if (searchTerm) {
      filtered = filtered.filter((invoice) =>
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por fornecedor
    if (selectedSupplier !== 'all') {
      filtered = filtered.filter(
        (invoice) => invoice.supplier_id?.toString() === selectedSupplier
      );
    }

    // Filtro por intervalo de datas (data de emissão)
    if (startDate) {
      filtered = filtered.filter(
        (invoice) => new Date(invoice.invoice_date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (invoice) => new Date(invoice.invoice_date) <= new Date(endDate)
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'invoice_number':
          aValue = a.invoice_number;
          bValue = b.invoice_number;
          break;
        case 'invoice_date':
          aValue = new Date(a.invoice_date).getTime();
          bValue = new Date(b.invoice_date).getTime();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'total_value':
          aValue = a.total_value;
          bValue = b.total_value;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchTerm, selectedSupplier, startDate, endDate, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('all');
    setStartDate('');
    setEndDate('');
    setFiltroAtivo('all');
  };

  const hasActiveFilters = searchTerm || selectedSupplier !== 'all' || startDate || endDate || filtroAtivo !== 'all';

  const handleExport = () => {
    exportToCSV(
      filteredAndSortedInvoices,
      'faturas',
      [
        { key: 'id', label: 'ID' },
        { key: 'invoice_number', label: 'Número' },
        { key: 'supplier', label: 'Fornecedor', format: (sup) => sup?.name || '-' },
        { key: 'invoice_date', label: 'Data Emissão', format: formatDateForExport },
        { key: 'due_date', label: 'Vencimento', format: formatDateForExport },
        { key: 'total_value', label: 'Valor Total', format: formatCurrencyForExport },
        { key: 'net_value', label: 'Valor Líquido', format: formatCurrencyForExport },
        { key: 'tax_value', label: 'Impostos', format: formatCurrencyForExport },
        { key: 'category', label: 'Categoria' },
        { key: 'status', label: 'Status', format: (s) => {
          const statusMap: Record<string, string> = {
            'pending': 'Pendente',
            'validated': 'Validada',
            'paid': 'Paga',
            'cancelled': 'Cancelada'
          };
          return statusMap[s] || s;
        }},
        { key: 'description', label: 'Descrição' },
      ]
    );
    toast.success(`${filteredAndSortedInvoices.length} fatura(s) exportada(s) com sucesso!`);
  };

  const handleDelete = async (invoice: Invoice) => {
    await confirm(
      {
        title: 'Confirmar Exclusão',
        description: `Tem certeza que deseja excluir a fatura ${invoice.invoice_number}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        type: 'danger',
      },
      async () => {
        try {
          await invoiceService.delete(invoice.id);
          toast.success('Fatura excluída com sucesso!');
          loadInvoices(); // Recarrega a lista
        } catch (err) {
          const error = err as Error;
          toast.error(error.message || 'Erro ao excluir fatura');
          throw err; // Re-throw para o useConfirm tratar
        }
      }
    );
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  const handleEditFromDetails = () => {
    setDetailsModalOpen(false);
    setEditModalOpen(true);
  };

  const handleDeleteFromDetails = () => {
    if (selectedInvoice) {
      setDetailsModalOpen(false);
      handleDelete(selectedInvoice);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
      'pending': { label: 'Pendente', variant: 'default' },
      'validated': { label: 'Validada', variant: 'secondary' },
      'paid': { label: 'Paga', variant: 'outline' },
      'cancelled': { label: 'Cancelada', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const filtros = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'validated', label: 'Validadas' },
    { key: 'paid', label: 'Pagas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <PrintLayout
      title="Relatório de Faturas"
      subtitle={`${filteredAndSortedInvoices.length} fatura(s) encontrada(s)`}
      showHeader
      showFooter
    >
      <div className="space-y-6">
        <NoPrint>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
            <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={invoices.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <PrintButton
            onClick={handlePrint}
            loading={isPrinting}
            label="Imprimir"
            variant="outline"
            disabled={invoices.length === 0}
          />
          <Button
            size="lg"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Fatura
          </Button>
          <InvoiceUploadModal onSuccess={loadInvoices}>
            <Button size="lg" variant="outline" data-tour="form-validation">
              <Upload className="mr-2 h-4 w-4" />
              Importar Fatura
            </Button>
          </InvoiceUploadModal>
        </div>
      </div>
        </NoPrint>

        {/* Resumo para impressão */}
        <PrintOnly>
          <PrintInfoGrid
            items={[
              { label: 'Total de Faturas', value: filteredAndSortedInvoices.length },
              { label: 'Pendentes', value: filteredAndSortedInvoices.filter(i => i.status === 'pending').length },
              { label: 'Pagas', value: filteredAndSortedInvoices.filter(i => i.status === 'paid').length },
              { label: 'Valor Total', value: formatCurrency(filteredAndSortedInvoices.reduce((sum, i) => sum + i.total_value, 0)) },
            ]}
          />
        </PrintOnly>

      {/* Filtros */}
      <NoPrint>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por número */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Buscar por Número
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o número da fatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por fornecedor */}
            <div className="w-64">
              <label className="text-sm font-medium mb-2 block">
                Fornecedor
              </label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os fornecedores</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtro por intervalo de datas */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Data Início
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Data Fim
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros por status */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {filtros.map((filtro) => (
                <Button
                  key={filtro.key}
                  variant={filtroAtivo === filtro.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFiltroAtivo(filtro.key as StatusFilter)}
                >
                  {filtro.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-muted-foreground pt-2 border-t">
            Mostrando <span className="font-semibold">{filteredAndSortedInvoices.length}</span> de{' '}
            <span className="font-semibold">{invoices.length}</span> faturas
          </div>
        </CardContent>
      </Card>
      </NoPrint>

      {/* Tabela */}
      {loading ? (
        <TableSkeleton rows={10} columns={7} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao carregar faturas"
          description={error}
          action={{
            label: "Tentar Novamente",
            onClick: loadInvoices
          }}
        />
      ) : filteredAndSortedInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma fatura encontrada"
          description={
            hasActiveFilters
              ? "Nenhuma fatura corresponde aos filtros selecionados. Tente ajustar os filtros."
              : "Você ainda não cadastrou nenhuma fatura. Comece criando sua primeira fatura ou importando uma fatura existente!"
          }
          action={
            !hasActiveFilters
              ? {
                  label: "Criar Primeira Fatura",
                  onClick: () => setCreateModalOpen(true)
                }
              : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto font-semibold"
                      onClick={() => handleSort('invoice_number')}
                    >
                      Número
                      {sortField === 'invoice_number' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {sortField !== 'invoice_number' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto font-semibold"
                      onClick={() => handleSort('invoice_date')}
                    >
                      Data Emissão
                      {sortField === 'invoice_date' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {sortField !== 'invoice_date' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto font-semibold"
                      onClick={() => handleSort('due_date')}
                    >
                      Vencimento
                      {sortField === 'due_date' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {sortField !== 'due_date' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto font-semibold"
                      onClick={() => handleSort('total_value')}
                    >
                      Valor
                      {sortField === 'total_value' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {sortField !== 'total_value' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-transparent p-0 h-auto font-semibold"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {sortField !== 'status' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      R$ {invoice.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(invoice)}
                          title="Visualizar detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                          title="Editar fatura"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(invoice)}
                          title="Excluir fatura"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modais */}
      <CreateInvoiceModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadInvoices}
      />

      <EditInvoiceModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        invoice={selectedInvoice}
        onSuccess={loadInvoices}
      />

      <InvoiceDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        invoice={selectedInvoice}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteFromDetails}
      />

      {ConfirmDialog}
      </div>
    </PrintLayout>
  );
};

export default ContasAPagar;

// Force server-side rendering to avoid static generation issues with hooks
export async function getServerSideProps() {
  return {
    props: {},
  };
}