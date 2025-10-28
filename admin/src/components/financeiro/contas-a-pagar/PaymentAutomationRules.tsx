'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, Zap, CheckCircle } from 'lucide-react';

export const PaymentAutomationRules: React.FC = () => {
  const [rules, setRules] = React.useState([
    {
      id: '1',
      nome: 'Alerta de Vencimento',
      descricao: 'Notificar 3 dias antes do vencimento',
      ativo: true,
      icon: Bell,
    },
    {
      id: '2',
      nome: 'Pagamento Automático',
      descricao: 'Pagar automaticamente faturas aprovadas',
      ativo: false,
      icon: Zap,
    },
    {
      id: '3',
      nome: 'Aprovação Expressa',
      descricao: 'Auto-aprovar faturas até R$ 1.000,00',
      ativo: true,
      icon: CheckCircle,
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, ativo: !r.ativo } : r));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Automação</CardTitle>
        <CardDescription>
          Configure automações para otimizar seu fluxo de pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.ativo}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-semibold">{rule.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {rule.descricao}
                      </p>
                    </div>
                  </div>
                  <Badge variant={rule.ativo ? 'default' : 'outline'}>
                    {rule.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
