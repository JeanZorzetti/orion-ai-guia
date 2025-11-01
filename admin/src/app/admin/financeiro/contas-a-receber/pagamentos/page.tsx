'use client';

import React, { useState, useMemo } from 'react';
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
import { CreditCard, QrCode, FileText, Loader2, TrendingUp } from 'lucide-react';
import { PixIntegration } from '@/components/financeiro/contas-a-receber/PixIntegration';
import { BoletoIntegration } from '@/components/financeiro/contas-a-receber/BoletoIntegration';
import { useAccountsReceivable } from '@/hooks/useAccountsReceivable';

const PagamentosPage: React.FC = () => {
  const { receivables, loading } = useAccountsReceivable();

  // Converter receivables da API para formato da página
  const contasReceber = useMemo(() => {
    return receivables
      .filter(r => r.status === 'pendente' || r.status === 'vencido') // Apenas contas não pagas
      .map(r => ({
        id: r.id.toString(),
        numeroDocumento: r.document_number,
        clienteId: r.customer_id.toString(),
        clienteNome: r.customer_name || `Cliente #${r.customer_id}`,
        clienteEmail: '', // Não temos email no modelo atual
        dataVencimento: new Date(r.due_date),
        valor: r.value - r.paid_value, // Valor pendente
        status: r.status as 'pendente' | 'vencido',
      }));
  }, [receivables]);

  const [selectedConta, setSelectedConta] = useState<string>('');

  // Auto-selecionar primeira conta quando carregado
  React.useEffect(() => {
    if (contasReceber.length > 0 && !selectedConta) {
      setSelectedConta(contasReceber[0].id);
    }
  }, [contasReceber, selectedConta]);

  const conta = contasReceber.find((c) => c.id === selectedConta);

  console.log('🔍 [PagamentosPage] Contas carregadas:', contasReceber.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contasReceber.length === 0) {
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta a receber encontrada</h3>
              <p className="text-muted-foreground">
                Não há contas pendentes ou vencidas para gerar meios de pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {contasReceber.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span className="font-medium">{c.numeroDocumento}</span>
                    <span>{c.clienteNome}</span>
                    <span className="font-bold text-green-600">
                      R$ {(c.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
