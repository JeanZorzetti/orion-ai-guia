'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { cn } from '@/lib/utils';

export const MultiAccountManagement: React.FC = () => {
  const { accounts, loading, getTotalBalance } = useBankAccounts();
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'corrente':
        return <Building2 className="h-5 w-5" />;
      case 'poupanca':
        return <Wallet className="h-5 w-5" />;
      case 'investimento':
        return <TrendingUp className="h-5 w-5" />;
      case 'caixa':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'corrente':
        return 'Corrente';
      case 'poupanca':
        return 'Poupança';
      case 'investimento':
        return 'Investimento';
      case 'caixa':
        return 'Caixa';
      default:
        return tipo;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contas Bancárias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px]">
            <p className="text-muted-foreground">Carregando contas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              Contas Bancárias
            </CardTitle>
            <CardDescription className="mt-1">
              Gerencie suas contas e visualize saldos consolidados
            </CardDescription>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedAccounts.includes(account.id) && "ring-2 ring-primary"
              )}
              onClick={() => toggleAccount(account.id)}
            >
              <CardHeader
                className="pb-3"
                style={{ borderLeft: `4px solid ${account.corPrimaria}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${account.corPrimaria}15` }}
                    >
                      <div style={{ color: account.corPrimaria }}>
                        {getTipoIcon(account.tipo)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{account.nome}</CardTitle>
                    </div>
                  </div>
                  <Badge variant={account.ativa ? 'default' : 'secondary'} className="text-xs">
                    {account.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-2">
                  {account.banco !== 'N/A' ? (
                    <>
                      {account.banco}<br />
                      Ag: {account.agencia} • Cc: {account.conta}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Caixa físico</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold" style={{ color: account.corPrimaria }}>
                    R$ {account.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getTipoLabel(account.tipo)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Saldo Consolidado */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Saldo Total Consolidado</p>
              <p className="text-xs text-muted-foreground">
                {accounts.filter(a => a.ativa).length} conta(s) ativa(s)
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                R$ {getTotalBalance().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atualizado agora
              </p>
            </div>
          </div>
        </div>

        {/* Distribuição por tipo */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {['corrente', 'poupanca', 'investimento', 'caixa'].map((tipo) => {
            const accountsOfType = accounts.filter(a => a.tipo === tipo && a.ativa);
            const totalOfType = accountsOfType.reduce((sum, a) => sum + a.saldo, 0);
            const percentage = getTotalBalance() > 0 ? (totalOfType / getTotalBalance() * 100) : 0;

            if (accountsOfType.length === 0) return null;

            return (
              <Card key={tipo} className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">
                    {getTipoLabel(tipo)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    R$ {(totalOfType / 1000).toFixed(1)}k
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {percentage.toFixed(1)}% do total
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
