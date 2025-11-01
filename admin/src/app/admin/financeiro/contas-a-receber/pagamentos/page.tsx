'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, QrCode, FileText, TrendingUp } from 'lucide-react';
import { PixIntegration } from '@/components/financeiro/contas-a-receber/PixIntegration';
import { BoletoIntegration } from '@/components/financeiro/contas-a-receber/BoletoIntegration';
import { addDays } from 'date-fns';

// Mock data - em produção viria do banco
const mockContasReceber = [
  {
    id: '1',
    numeroDocumento: 'NF-1234',
    clienteId: '1',
    clienteNome: 'Empresa ABC Ltda',
    clienteEmail: 'contato@empresaabc.com.br',
    dataVencimento: addDays(new Date(), 5),
    valor: 5800.0,
    status: 'pendente' as const,
  },
  {
    id: '2',
    numeroDocumento: 'NF-1235',
    clienteId: '2',
    clienteNome: 'Comercial XYZ S.A.',
    clienteEmail: 'financeiro@comercialxyz.com.br',
    dataVencimento: addDays(new Date(), 26),
    valor: 12500.0,
    status: 'pendente' as const,
  },
  {
    id: '3',
    numeroDocumento: 'NF-1236',
    clienteId: '3',
    clienteNome: 'Distribuidora 123',
    clienteEmail: 'cobranca@dist123.com.br',
    dataVencimento: addDays(new Date(), -5),
    valor: 3200.0,
    status: 'vencido' as const,
  },
];

const PagamentosPage: React.FC = () => {
  const [selectedConta, setSelectedConta] = useState<string>(mockContasReceber[0].id);

  const conta = mockContasReceber.find((c) => c.id === selectedConta);

  if (!conta) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-green-500" />
            Meios de Pagamento
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere PIX e Boletos para facilitar os recebimentos
          </p>
        </div>
      </div>

      {/* Seletor de Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione a Conta a Receber</CardTitle>
          <CardDescription>
            Escolha o título para gerar os meios de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedConta} onValueChange={setSelectedConta}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockContasReceber.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium">{c.numeroDocumento}</span>
                    <span>{c.clienteNome}</span>
                    <span className="font-bold text-green-600">
                      R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Badge variant={c.status === 'vencido' ? 'destructive' : 'default'}>
                      {c.status}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Informações da Conta Selecionada */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="text-lg">Informações do Título</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Documento</p>
              <p className="font-semibold">{conta.numeroDocumento}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-semibold">{conta.clienteNome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vencimento</p>
              <p className="font-semibold">
                {conta.dataVencimento.toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {(conta.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Meios de Pagamento */}
      <Tabs defaultValue="pix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pix" className="gap-2">
            <QrCode className="h-4 w-4" />
            PIX
          </TabsTrigger>
          <TabsTrigger value="boleto" className="gap-2">
            <FileText className="h-4 w-4" />
            Boleto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pix">
          <PixIntegration
            contaReceberId={conta.id}
            valor={conta.valor}
            clienteNome={conta.clienteNome}
            clienteEmail={conta.clienteEmail}
          />
        </TabsContent>

        <TabsContent value="boleto">
          <BoletoIntegration
            contaReceberId={conta.id}
            valor={conta.valor}
            vencimento={conta.dataVencimento}
            clienteNome={conta.clienteNome}
            clienteEmail={conta.clienteEmail}
          />
        </TabsContent>
      </Tabs>

      {/* Informações sobre as Integrações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Sobre as Integrações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-blue-500" />
                PIX
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Recebimento instantâneo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>QR Code válido por 1 hora</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Confirmação automática via webhook</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Sem taxas adicionais para o cliente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Envio por email com QR Code incluso</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                Boleto Bancário
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Aceito em todos os bancos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Multa e juros configuráveis</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>PDF para impressão ou envio digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Baixa automática via arquivo retorno</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Instruções personalizadas para o banco</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm">
              <span className="font-semibold">💡 Dica:</span> Em ambiente de produção,
              as integrações se conectam automaticamente aos bancos via API. Os pagamentos
              são confirmados automaticamente e o recebimento é registrado sem intervenção manual.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagamentosPage;
