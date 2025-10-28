'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, DollarSign, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ContaReceber {
  id: string;
  clienteNome: string;
  documento: string;
  valor: number;
  dataVencimento: Date;
}

interface QuickPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contaReceber: ContaReceber;
  onConfirm?: (data: PaymentData) => void;
}

interface PaymentData {
  valorRecebido: number;
  dataRecebimento: Date;
  formaPagamento: string;
  desconto: number;
  juros: number;
  multa: number;
  observacoes: string;
  enviarComprovante: boolean;
}

export const QuickPaymentDialog: React.FC<QuickPaymentDialogProps> = ({
  open,
  onOpenChange,
  contaReceber,
  onConfirm,
}) => {
  const [formData, setFormData] = useState<PaymentData>({
    valorRecebido: contaReceber.valor,
    dataRecebimento: new Date(),
    formaPagamento: 'pix',
    desconto: 0,
    juros: 0,
    multa: 0,
    observacoes: '',
    enviarComprovante: true,
  });

  // Calcular dias de atraso
  const diasAtraso = useMemo(() => {
    const hoje = new Date();
    const vencimento = new Date(contaReceber.dataVencimento);
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [contaReceber.dataVencimento]);

  // Calcular juros e multa automaticamente se houver atraso
  useMemo(() => {
    if (diasAtraso > 0) {
      const multaCalculada = contaReceber.valor * 0.02; // 2% de multa
      const jurosCalculados = contaReceber.valor * 0.001 * diasAtraso; // 0.1% ao dia
      setFormData(prev => ({
        ...prev,
        multa: multaCalculada,
        juros: jurosCalculados,
      }));
    }
  }, [diasAtraso, contaReceber.valor]);

  // Calcular valor final
  const valorFinal = useMemo(() => {
    return formData.valorRecebido + formData.juros + formData.multa - formData.desconto;
  }, [formData.valorRecebido, formData.desconto, formData.juros, formData.multa]);

  const handleSubmit = () => {
    if (onConfirm) {
      onConfirm(formData);
    }
    onOpenChange(false);
  };

  const aplicarDescontoPagamentoAntecipado = () => {
    const descontoSugerido = contaReceber.valor * 0.03; // 3% de desconto
    setFormData(prev => ({ ...prev, desconto: descontoSugerido }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Recebimento</DialogTitle>
          <DialogDescription>
            {contaReceber.clienteNome} - {contaReceber.documento}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Informações do título */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-xs text-muted-foreground">Valor Original</Label>
              <p className="text-lg font-bold">
                R$ {contaReceber.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vencimento</Label>
              <p className="text-lg font-semibold">
                {format(contaReceber.dataVencimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              {diasAtraso > 0 && (
                <p className="text-sm text-destructive font-medium mt-1">
                  {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'} de atraso
                </p>
              )}
            </div>
          </div>

          {/* Valor recebido e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="valorRecebido">Valor Recebido</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="valorRecebido"
                  type="number"
                  step="0.01"
                  value={formData.valorRecebido}
                  onChange={(e) => setFormData({ ...formData, valorRecebido: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Data de Recebimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !formData.dataRecebimento && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataRecebimento ? (
                      format(formData.dataRecebimento, 'dd/MM/yyyy')
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dataRecebimento}
                    onSelect={(date) => date && setFormData({ ...formData, dataRecebimento: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Acréscimos e Descontos */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="desconto">Desconto</Label>
                {diasAtraso === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={aplicarDescontoPagamentoAntecipado}
                    className="h-6 text-xs"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    3%
                  </Button>
                )}
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="desconto"
                  type="number"
                  step="0.01"
                  value={formData.desconto}
                  onChange={(e) => setFormData({ ...formData, desconto: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="juros">Juros</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="juros"
                  type="number"
                  step="0.01"
                  value={formData.juros}
                  onChange={(e) => setFormData({ ...formData, juros: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
              {diasAtraso > 0 && (
                <p className="text-xs text-muted-foreground">
                  0.1% ao dia × {diasAtraso} dias
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="multa">Multa</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="multa"
                  type="number"
                  step="0.01"
                  value={formData.multa}
                  onChange={(e) => setFormData({ ...formData, multa: Number(e.target.value) })}
                  className="pl-10"
                />
              </div>
              {diasAtraso > 0 && (
                <p className="text-xs text-muted-foreground">2% sobre o valor</p>
              )}
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="grid gap-2">
            <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
            <Select
              value={formData.formaPagamento}
              onValueChange={(v) => setFormData({ ...formData, formaPagamento: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="boleto">Boleto Bancário</SelectItem>
                <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="grid gap-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              rows={3}
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o recebimento..."
            />
          </div>

          {/* Enviar comprovante */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enviarComprovante"
              checked={formData.enviarComprovante}
              onCheckedChange={(checked) => setFormData({ ...formData, enviarComprovante: checked })}
            />
            <Label htmlFor="enviarComprovante" className="cursor-pointer">
              Enviar comprovante de recebimento por email para o cliente
            </Label>
          </div>

          {/* Resumo do valor final */}
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Recebido:</span>
                <span className="font-medium">
                  R$ {formData.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {formData.desconto > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span className="font-medium">
                    - R$ {formData.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {formData.juros > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Juros:</span>
                  <span className="font-medium">
                    + R$ {formData.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {formData.multa > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Multa:</span>
                  <span className="font-medium">
                    + R$ {formData.multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-lg font-semibold">Valor Final</span>
              <span className="text-3xl font-bold text-green-600">
                R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Confirmar Recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
