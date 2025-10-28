'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Mail, MessageSquare, Smartphone, Clock, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ReminderRule {
  id: string;
  nome: string;
  trigger: 'dias_antes_vencimento' | 'dias_apos_vencimento' | 'valor_minimo';
  diasTrigger: number;
  valorMinimo?: number;
  canal: 'email' | 'whatsapp' | 'sms' | 'todos';
  template: string;
  ativo: boolean;
  ultimaExecucao?: Date;
  totalEnviados: number;
}

// Mock data
const mockRules: ReminderRule[] = [
  {
    id: '1',
    nome: 'Lembrete 3 dias antes do vencimento',
    trigger: 'dias_antes_vencimento',
    diasTrigger: 3,
    canal: 'email',
    template: 'lembrete_prevencimento',
    ativo: true,
    ultimaExecucao: new Date(Date.now() - 1000 * 60 * 60 * 24),
    totalEnviados: 145,
  },
  {
    id: '2',
    nome: 'Cobrança 1 dia após vencimento',
    trigger: 'dias_apos_vencimento',
    diasTrigger: 1,
    canal: 'whatsapp',
    template: 'cobranca_vencido',
    ativo: true,
    ultimaExecucao: new Date(Date.now() - 1000 * 60 * 60 * 12),
    totalEnviados: 89,
  },
  {
    id: '3',
    nome: 'Cobrança urgente 7 dias após vencimento',
    trigger: 'dias_apos_vencimento',
    diasTrigger: 7,
    canal: 'todos',
    template: 'cobranca_urgente',
    ativo: true,
    ultimaExecucao: new Date(Date.now() - 1000 * 60 * 60 * 48),
    totalEnviados: 34,
  },
  {
    id: '4',
    nome: 'Alerta para títulos acima de R$ 10.000',
    trigger: 'valor_minimo',
    diasTrigger: 0,
    valorMinimo: 10000,
    canal: 'email',
    template: 'alerta_valor_alto',
    ativo: false,
    totalEnviados: 12,
  },
];

const getChannelIcon = (canal: string) => {
  switch (canal) {
    case 'email':
      return <Mail className="h-4 w-4 text-blue-500" />;
    case 'whatsapp':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'sms':
      return <Smartphone className="h-4 w-4 text-purple-500" />;
    case 'todos':
      return <Mail className="h-4 w-4 text-orange-500" />;
    default:
      return null;
  }
};

const getChannelLabel = (canal: string) => {
  switch (canal) {
    case 'email':
      return 'Email';
    case 'whatsapp':
      return 'WhatsApp';
    case 'sms':
      return 'SMS';
    case 'todos':
      return 'Todos os canais';
    default:
      return canal;
  }
};

export const AutomatedReminders: React.FC = () => {
  const [rules, setRules] = useState<ReminderRule[]>(mockRules);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ReminderRule>>({
    nome: '',
    trigger: 'dias_antes_vencimento',
    diasTrigger: 3,
    canal: 'email',
    template: 'lembrete_prevencimento',
    ativo: true,
  });

  const toggleRule = (id: string, ativo: boolean) => {
    setRules(rules.map(rule =>
      rule.id === id ? { ...rule, ativo } : rule
    ));
  };

  const handleCreateRule = () => {
    const rule: ReminderRule = {
      id: Date.now().toString(),
      nome: newRule.nome || 'Nova regra',
      trigger: newRule.trigger || 'dias_antes_vencimento',
      diasTrigger: newRule.diasTrigger || 3,
      valorMinimo: newRule.valorMinimo,
      canal: newRule.canal || 'email',
      template: newRule.template || 'lembrete_prevencimento',
      ativo: newRule.ativo ?? true,
      totalEnviados: 0,
    };

    setRules([...rules, rule]);
    setIsDialogOpen(false);
    setNewRule({
      nome: '',
      trigger: 'dias_antes_vencimento',
      diasTrigger: 3,
      canal: 'email',
      template: 'lembrete_prevencimento',
      ativo: true,
    });
  };

  const getTriggerDescription = (rule: ReminderRule) => {
    if (rule.trigger === 'dias_antes_vencimento') {
      return `${rule.diasTrigger} dias antes do vencimento`;
    } else if (rule.trigger === 'dias_apos_vencimento') {
      return `${rule.diasTrigger} dias após vencimento`;
    } else {
      return `Valor mínimo: R$ ${rule.valorMinimo?.toLocaleString('pt-BR')}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automação de Cobranças</CardTitle>
        <CardDescription>
          Configure lembretes automáticos para clientes baseados em regras
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Lista de regras de automação */}
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{rule.nome}</h4>
                  {rule.ativo ? (
                    <Badge variant="default" className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTriggerDescription(rule)}
                  </div>
                  <div className="flex items-center gap-1">
                    {getChannelIcon(rule.canal)}
                    {getChannelLabel(rule.canal)}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>{rule.totalEnviados} enviados</span>
                  {rule.ultimaExecucao && (
                    <span>
                      Última execução: {new Date(rule.ultimaExecucao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={rule.ativo}
                  onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                />
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Dialog para criar nova regra */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra de Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Regra de Cobrança</DialogTitle>
                <DialogDescription>
                  Configure quando e como os clientes serão notificados automaticamente
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome da Regra</Label>
                  <Input
                    id="nome"
                    value={newRule.nome}
                    onChange={(e) => setNewRule({ ...newRule, nome: e.target.value })}
                    placeholder="Ex: Lembrete 3 dias antes do vencimento"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="trigger">Condição de Disparo</Label>
                  <Select
                    value={newRule.trigger}
                    onValueChange={(value: ReminderRule['trigger']) => setNewRule({ ...newRule, trigger: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dias_antes_vencimento">Dias antes do vencimento</SelectItem>
                      <SelectItem value="dias_apos_vencimento">Dias após vencimento</SelectItem>
                      <SelectItem value="valor_minimo">Valor mínimo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newRule.trigger === 'dias_antes_vencimento' || newRule.trigger === 'dias_apos_vencimento') && (
                  <div className="grid gap-2">
                    <Label htmlFor="diasTrigger">Número de Dias</Label>
                    <Input
                      id="diasTrigger"
                      type="number"
                      value={newRule.diasTrigger}
                      onChange={(e) => setNewRule({ ...newRule, diasTrigger: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                )}

                {newRule.trigger === 'valor_minimo' && (
                  <div className="grid gap-2">
                    <Label htmlFor="valorMinimo">Valor Mínimo (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="valorMinimo"
                        type="number"
                        value={newRule.valorMinimo || ''}
                        onChange={(e) => setNewRule({ ...newRule, valorMinimo: Number(e.target.value) })}
                        className="pl-10"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="canal">Canal de Comunicação</Label>
                  <Select
                    value={newRule.canal}
                    onValueChange={(value: ReminderRule['canal']) => setNewRule({ ...newRule, canal: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="todos">Todos os canais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="template">Template de Mensagem</Label>
                  <Select
                    value={newRule.template}
                    onValueChange={(value) => setNewRule({ ...newRule, template: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lembrete_prevencimento">Lembrete Pré-Vencimento</SelectItem>
                      <SelectItem value="cobranca_vencido">Cobrança - Título Vencido</SelectItem>
                      <SelectItem value="cobranca_urgente">Cobrança Urgente</SelectItem>
                      <SelectItem value="alerta_valor_alto">Alerta - Valor Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={newRule.ativo}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativar regra imediatamente</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRule}>
                  Criar Regra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
