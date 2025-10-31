'use client';

import React, { useState } from 'react';
import { SupplierPerformanceProfile } from '@/components/financeiro/contas-a-pagar/SupplierPerformanceProfile';
import { SupplierComparison } from '@/components/financeiro/contas-a-pagar/SupplierComparison';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSuppliers } from '@/hooks/useSuppliers';

export default function ContasAPagarFornecedoresPage() {
  const { suppliers, loading, error, refetch } = useSuppliers();
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selecionar primeiro fornecedor quando a lista carregar
  React.useEffect(() => {
    if (suppliers.length > 0 && !selectedFornecedor) {
      setSelectedFornecedor(suppliers[0].id.toString());
    }
  }, [suppliers, selectedFornecedor]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/financeiro/contas-a-pagar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Análise de Fornecedores</h1>
            <p className="text-muted-foreground">
              Avalie performance e compare fornecedores
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil de Performance</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Loading/Error States */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum fornecedor cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Cadastre fornecedores para visualizar suas análises de performance.
              </p>
            </div>
          ) : (
            <>
              {/* Seletor de Fornecedor */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Selecione o Fornecedor:</label>
                <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                  <SelectTrigger className="w-80">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Perfil */}
              {selectedFornecedor && (
                <SupplierPerformanceProfile fornecedorId={selectedFornecedor} />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <SupplierComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
