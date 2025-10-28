import React from 'react';
import { Shield } from 'lucide-react';
import { CustomerRiskProfile } from '@/components/financeiro/contas-a-receber/CustomerRiskProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AnaliseRiscoPage() {
  // Mock de clientes - em produção viria de uma API
  const clientes = [
    { id: '1', nome: 'Empresa ABC Ltda' },
    { id: '2', nome: 'Comercial XYZ S.A.' },
    { id: '3', nome: 'Distribuidora 123' },
    { id: '4', nome: 'Indústria DEF' },
    { id: '5', nome: 'Varejo GHI' },
  ];

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
    </div>
  );
}
