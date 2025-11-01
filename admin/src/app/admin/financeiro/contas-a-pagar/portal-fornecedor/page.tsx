'use client';

import React, { useState, useMemo } from 'react';
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
import { useSuppliers } from '@/hooks/useSuppliers';

export default function PortalFornecedorPage() {
  const { suppliers, loading } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; nome: string } | null>(
    null
  );

  // Converter suppliers para o formato esperado pela UI
  const suppliersList = useMemo(() => {
    return suppliers.map(supplier => ({
      id: supplier.id.toString(),
      nome: supplier.name,
      cnpj: supplier.document || '-', // document pode ser CNPJ ou CPF
      // TODO: Quando implementarmos o sistema de portal access no backend,
      // buscar dados reais de acesso. Por enquanto, simular baseado no ID
      hasAccess: supplier.id <= 3, // Primeiros 3 fornecedores têm acesso (mock temporário)
      token: `supplier-${supplier.id}`,
      lastAccess: supplier.id <= 3 ? new Date(Date.now() - supplier.id * 24 * 60 * 60 * 1000) : undefined,
      accessCount: supplier.id <= 3 ? Math.floor(Math.random() * 30) + 5 : undefined,
    }));
  }, [suppliers]);

  const filteredSuppliers = suppliersList.filter(
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{suppliersList.length}</div>
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
              {suppliersList.filter((s) => s.hasAccess).length}
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
              {suppliersList.filter((s) => !s.hasAccess).length}
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
