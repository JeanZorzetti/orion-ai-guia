'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { CustomerRiskProfile } from '@/components/financeiro/contas-a-receber/CustomerRiskProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllCustomerRiskScores } from '@/hooks/useCustomerRiskScore';

export default function AnaliseRiscoPage() {
  // Buscar clientes reais da API baseado em receivables
  const allRiskScores = useAllCustomerRiskScores();

  const clientes = allRiskScores.map(rs => ({
    id: rs.clienteId,
    nome: rs.clienteNome,
  }));

  console.log('🔍 [AnaliseRiscoPage] Clientes carregados:', clientes.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-500" />
            Análise de Risco
          </h1>
          <p className="text-muted-foreground mt-1">
            Score de crédito e análise preditiva de clientes
          </p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            Não há dados de contas a receber para calcular análise de risco
          </p>
        </div>
      ) : (
        <Tabs defaultValue={clientes[0].id} className="space-y-6">
        <TabsList>
          {clientes.map((cliente) => (
            <TabsTrigger key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </TabsTrigger>
          ))}
        </TabsList>

        {clientes.map((cliente) => (
          <TabsContent key={cliente.id} value={cliente.id} className="space-y-6">
            <CustomerRiskProfile clienteId={cliente.id} />
          </TabsContent>
        ))}
      </Tabs>
      )}
    </div>
  );
}
