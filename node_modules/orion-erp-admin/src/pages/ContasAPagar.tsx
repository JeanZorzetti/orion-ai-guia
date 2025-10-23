'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Button } from '../../src/components/ui/button';
import { Badge } from '../../src/components/ui/badge';
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
  Loader2,
  Plus,
  Eye
} from 'lucide-react';
import { invoiceService } from '../services/invoice';
import { Invoice } from '../types';
import { toast } from 'sonner';

type StatusFilter = 'pending' | 'validated' | 'paid' | 'cancelled' | 'all';

const ContasAPagar: React.FC = () => {
  const [filtroAtivo, setFiltroAtivo] = useState<StatusFilter>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos modais
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadInvoices();
  }, [filtroAtivo]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoiceService.getAll({
        status_filter: filtroAtivo === 'all' ? undefined : filtroAtivo,
        limit: 100
      });
      setInvoices(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
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

  const filtros = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendentes' },
    { key: 'validated', label: 'Validadas' },
    { key: 'paid', label: 'Pagas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
        <div className="flex gap-2">
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
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
        </CardContent>
      </Card>

      {/* Tabela */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadInvoices} className="mt-4">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma fatura encontrada com os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
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
  );
};

export default ContasAPagar;

// Force server-side rendering to avoid static generation issues with hooks
export async function getServerSideProps() {
  return {
    props: {},
  };
}