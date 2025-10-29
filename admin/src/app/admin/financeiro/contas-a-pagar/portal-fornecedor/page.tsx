'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GenerateSupplierAccessDialog } from '@/components/financeiro/contas-a-pagar/GenerateSupplierAccessDialog';
import { ExternalLink, Plus, Search, Shield, ShieldOff, Eye, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data de fornecedores
const mockSuppliers = [
  {
    id: 'fornecedor-alpha',
    nome: 'Alpha Distribuidora Ltda',
    cnpj: '12.345.678/0001-90',
    hasAccess: true,
    token: 'token-alpha-2025',
    lastAccess: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    accessCount: 15,
  },
  {
    id: 'fornecedor-beta',
    nome: 'Beta Suprimentos S.A.',
    cnpj: '98.765.432/0001-10',
    hasAccess: true,
    token: 'token-beta-2025',
    lastAccess: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    accessCount: 28,
  },
  {
    id: 'fornecedor-gamma',
    nome: 'Gamma Indústria Ltda',
    cnpj: '11.222.333/0001-44',
    hasAccess: true,
    token: 'token-gamma-2025',
    lastAccess: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    accessCount: 8,
  },
  {
    id: 'fornecedor-delta',
    nome: 'Delta Comercial Ltda',
    cnpj: '55.666.777/0001-88',
    hasAccess: false,
  },
  {
    id: 'fornecedor-epsilon',
    nome: 'Epsilon Materiais S.A.',
    cnpj: '99.888.777/0001-66',
    hasAccess: false,
  },
];

export default function PortalFornecedorPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; nome: string } | null>(
    null
  );

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.cnpj.includes(searchTerm)
  );

  const handleGenerateAccess = (supplierId: string, supplierName: string) => {
    setSelectedSupplier({ id: supplierId, nome: supplierName });
    setDialogOpen(true);
  };

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/portal/fornecedor/${token}`;
    navigator.clipboard.writeText(url);
    // TODO: Mostrar toast de sucesso
  };

  const handleOpenPortal = (token: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/portal/fornecedor/${token}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal do Fornecedor</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o acesso dos fornecedores ao portal de consulta
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <span>Financeiro</span>
        <span className="mx-2">/</span>
        <span>Contas a Pagar</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Portal do Fornecedor</span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Totais</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSuppliers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Acesso</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockSuppliers.filter((s) => s.hasAccess).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">acessos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Acesso</CardTitle>
            <ShieldOff className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockSuppliers.filter((s) => !s.hasAccess).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">aguardando acesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fornecedores</CardTitle>
              <CardDescription>Gerencie o acesso ao portal para cada fornecedor</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar fornecedor..."
                  className="pl-8 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Total Acessos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.cnpj}</TableCell>
                  <TableCell>
                    {supplier.hasAccess ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Shield className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Sem acesso
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.lastAccess ? (
                      <span className="text-sm">
                        {format(supplier.lastAccess, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.accessCount !== undefined ? (
                      <span className="text-sm font-medium">{supplier.accessCount}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {supplier.hasAccess ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenPortal(supplier.token!)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(supplier.token!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateAccess(supplier.id, supplier.nome)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Gerar Acesso
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum fornecedor encontrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Access Dialog */}
      {selectedSupplier && (
        <GenerateSupplierAccessDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          fornecedorId={selectedSupplier.id}
          fornecedorNome={selectedSupplier.nome}
        />
      )}
    </div>
  );
}
