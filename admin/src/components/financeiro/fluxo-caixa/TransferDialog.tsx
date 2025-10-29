'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useAccountTransfers } from '@/hooks/useAccountTransfers';

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TransferDialog: React.FC<TransferDialogProps> = ({ open, onOpenChange }) => {
  const { accounts } = useBankAccounts();
  const { addTransfer } = useAccountTransfers();

  const [formData, setFormData] = useState({
    contaOrigemId: '',
    contaDestinoId: '',
    valor: '',
    tipo: 'transferencia' as 'transferencia' | 'aplicacao' | 'resgate',
    descricao: ''
  });

  const [error, setError] = useState('');

  const activeAccounts = accounts.filter(a => a.ativa);

  const contaOrigem = activeAccounts.find(a => a.id === formData.contaOrigemId);
  const contaDestino = activeAccounts.find(a => a.id === formData.contaDestinoId);

  const handleSubmit = () => {
    setError('');

    // Validações
    if (!formData.contaOrigemId) {
      setError('Selecione a conta de origem');
      return;
    }

    if (!formData.contaDestinoId) {
      setError('Selecione a conta de destino');
      return;
    }

    if (formData.contaOrigemId === formData.contaDestinoId) {
      setError('As contas de origem e destino devem ser diferentes');
      return;
    }

    const valor = parseFloat(formData.valor);
    if (isNaN(valor) || valor <= 0) {
      setError('Informe um valor válido');
      return;
    }

    if (contaOrigem && valor > contaOrigem.saldo) {
      setError('Saldo insuficiente na conta de origem');
      return;
    }

    if (!formData.descricao.trim()) {
      setError('Informe uma descrição para a transferência');
      return;
    }

    // Criar transferência
    if (contaOrigem && contaDestino) {
      addTransfer({
        data: new Date(),
        contaOrigem,
        contaDestino,
        valor,
        tipo: formData.tipo,
        descricao: formData.descricao
      });

      // Resetar formulário
      setFormData({
        contaOrigemId: '',
        contaDestinoId: '',
        valor: '',
        tipo: 'transferencia',
        descricao: ''
      });

      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-purple-500" />
            Nova Transferência Entre Contas
          </DialogTitle>
          <DialogDescription>
            Transfira valores entre suas contas bancárias
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Transferência */}
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <Select
              value={formData.tipo}
              onValueChange={(v: 'transferencia' | 'aplicacao' | 'resgate') =>
                setFormData({ ...formData, tipo: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="aplicacao">Aplicação</SelectItem>
                <SelectItem value="resgate">Resgate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conta de Origem */}
          <div className="space-y-2">
            <Label>Conta de Origem</Label>
            <Select
              value={formData.contaOrigemId}
              onValueChange={(v) => setFormData({ ...formData, contaOrigemId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: account.corPrimaria }}
                      />
                      {account.nome} - R$ {account.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contaOrigem && (
              <p className="text-xs text-muted-foreground">
                Saldo disponível: R$ {contaOrigem.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {/* Conta de Destino */}
          <div className="space-y-2">
            <Label>Conta de Destino</Label>
            <Select
              value={formData.contaDestinoId}
              onValueChange={(v) => setFormData({ ...formData, contaDestinoId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {activeAccounts
                  .filter(a => a.id !== formData.contaOrigemId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: account.corPrimaria }}
                        />
                        {account.nome} - R$ {account.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Ex: Transferência para investimento mensal"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Resumo */}
          {contaOrigem && contaDestino && formData.valor && parseFloat(formData.valor) > 0 && (
            <Alert>
              <ArrowRightLeft className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Resumo da Transferência:</p>
                  <p className="text-sm">
                    De: {contaOrigem.nome} → Para: {contaDestino.nome}
                  </p>
                  <p className="text-sm font-semibold">
                    Valor: R$ {parseFloat(formData.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Novo saldo em {contaOrigem.nome}: R$ {(contaOrigem.saldo - parseFloat(formData.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Novo saldo em {contaDestino.nome}: R$ {(contaDestino.saldo + parseFloat(formData.valor)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Confirmar Transferência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
