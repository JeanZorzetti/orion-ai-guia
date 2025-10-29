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
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const fornecedores = [
  { id: '1', nome: 'Fornecedor Alpha Ltda' },
  { id: '2', nome: 'Beta Fornecimentos S.A.' },
  { id: '3', nome: 'Gamma Comércio Ltda' },
];

export default function ContasAPagarFornecedoresPage() {
  const [selectedFornecedor, setSelectedFornecedor] = useState('1');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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
          {/* Seletor de Fornecedor */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Selecione o Fornecedor:</label>
            <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
              <SelectTrigger className="w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Perfil */}
          <SupplierPerformanceProfile fornecedorId={selectedFornecedor} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <SupplierComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
