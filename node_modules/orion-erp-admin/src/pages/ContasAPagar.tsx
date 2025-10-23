'use client';

import React, { useState } from 'react';
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
import {
  Upload,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';

type StatusConta = 'a-vencer' | 'vencida' | 'paga';

interface ContaPagar {
  id: number;
  fornecedor: string;
  vencimento: string;
  valor: number;
  status: StatusConta;
  descricao: string;
}

const ContasAPagar: React.FC = () => {
  const [filtroAtivo, setFiltroAtivo] = useState<StatusConta | 'todos'>('todos');

  const contas: ContaPagar[] = [
    {
      id: 1,
      fornecedor: 'Fornecedor ABC Ltda',
      vencimento: '2024-01-15',
      valor: 2500.00,
      status: 'a-vencer',
      descricao: 'Compra de materiais'
    },
    {
      id: 2,
      fornecedor: 'Distribuidora XYZ',
      vencimento: '2024-01-10',
      valor: 1800.50,
      status: 'vencida',
      descricao: 'Produtos para revenda'
    },
    {
      id: 3,
      fornecedor: 'Serviços Tech',
      vencimento: '2024-01-05',
      valor: 980.00,
      status: 'paga',
      descricao: 'Manutenção sistema'
    },
    {
      id: 4,
      fornecedor: 'Fornecedor DEF',
      vencimento: '2024-01-20',
      valor: 3200.00,
      status: 'a-vencer',
      descricao: 'Estoque geral'
    },
  ];

  const getStatusBadge = (status: StatusConta) => {
    const statusConfig = {
      'a-vencer': { label: 'A Vencer', variant: 'default' as const },
      'vencida': { label: 'Vencida', variant: 'destructive' as const },
      'paga': { label: 'Paga', variant: 'secondary' as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const contasFiltradas = filtroAtivo === 'todos'
    ? contas
    : contas.filter(conta => conta.status === filtroAtivo);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
    } catch {
      return dateString; // Fallback to original string if parsing fails
    }
  };

  const filtros = [
    { key: 'todos', label: 'Todas' },
    { key: 'a-vencer', label: 'A Vencer' },
    { key: 'vencida', label: 'Vencidas' },
    { key: 'paga', label: 'Pagas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Contas a Pagar</h1>
        <InvoiceUploadModal>
          <Button size="lg" data-tour="form-validation">
            <Upload className="mr-2 h-4 w-4" />
            Importar Fatura
          </Button>
        </InvoiceUploadModal>
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
                onClick={() => setFiltroAtivo(filtro.key as StatusConta | 'todos')}
              >
                {filtro.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasFiltradas.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="font-medium">{conta.fornecedor}</TableCell>
                  <TableCell className="text-muted-foreground">{conta.descricao}</TableCell>
                  <TableCell>
                    {formatDate(conta.vencimento)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{getStatusBadge(conta.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
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

      {contasFiltradas.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma conta encontrada com os filtros selecionados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContasAPagar;