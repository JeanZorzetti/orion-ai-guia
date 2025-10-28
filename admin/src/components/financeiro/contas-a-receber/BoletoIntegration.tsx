'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Copy,
  Mail,
  Download,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useBoleto } from '@/hooks/useBoleto';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BoletoIntegrationProps {
  contaReceberId: string;
  valor: number;
  vencimento: Date;
  clienteNome: string;
  clienteEmail?: string;
}

export const BoletoIntegration: React.FC<BoletoIntegrationProps> = ({
  contaReceberId,
  valor,
  vencimento: vencimentoInicial,
  clienteNome,
  clienteEmail,
}) => {
  const {
    boleto,
    isLoading,
    isGenerating,
    error,
    generateBoleto,
    checkStatus,
    cancelBoleto,
    downloadPdf,
  } = useBoleto(contaReceberId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Parâmetros de geração
  const [vencimento, setVencimento] = useState<Date>(vencimentoInicial);
  const [multa, setMulta] = useState(2);
  const [juros, setJuros] = useState(0.033);
  const [desconto, setDesconto] = useState<number | undefined>(undefined);
  const [instrucoes, setInstrucoes] = useState('');

  // Auto-refresh status a cada 30 segundos se o boleto estiver ativo
  useEffect(() => {
    if (boleto && boleto.status === 'registrado') {
      const interval = setInterval(() => {
        checkStatus();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [boleto, checkStatus]);

  const handleGenerate = async () => {
    await generateBoleto({
      contaReceberId,
      valor,
      vencimento,
      multa,
      juros,
      desconto,
      instrucoes,
    });
    setIsDialogOpen(false);
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleSendByEmail = async () => {
    if (!boleto || !clienteEmail) return;

    // Simulação de envio de email
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const getStatusBadge = (status: 'registrado' | 'pago' | 'vencido' | 'cancelado') => {
    switch (status) {
      case 'registrado':
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Pagamento
          </Badge>
        );
      case 'pago':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'vencido':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Vencido
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge variant="outline">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const calcularValorComEncargos = () => {
    if (!boleto || boleto.status !== 'vencido') return boleto?.valor || 0;

    const hoje = new Date();
    const diasAtraso = Math.floor(
      (hoje.getTime() - boleto.dataVencimento.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasAtraso <= 0) return boleto.valor;

    const valorMulta = boleto.valor * (boleto.multa / 100);
    const valorJuros = boleto.valor * (boleto.juros / 100) * diasAtraso;

    return boleto.valor + valorMulta + valorJuros;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Boleto Bancário
            </CardTitle>
            <CardDescription>
              Gere um boleto bancário para pagamento
            </CardDescription>
          </div>
          {boleto && getStatusBadge(boleto.status)}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!boleto ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <span className="font-medium">{clienteNome}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Vencimento:</span>
                <span className="font-medium">
                  {format(vencimentoInicial, 'dd/MM/yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Boleto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurar Boleto</DialogTitle>
                  <DialogDescription>
                    Configure os parâmetros do boleto antes de gerar
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Vencimento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !vencimento && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {vencimento ? format(vencimento, 'dd/MM/yyyy') : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={vencimento}
                            onSelect={(date) => date && setVencimento(date)}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Valor</Label>
                      <Input
                        type="number"
                        value={valor}
                        disabled
                        className="font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Multa (%)
                        <span className="text-xs text-muted-foreground ml-1">
                          após vencimento
                        </span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={multa}
                        onChange={(e) => setMulta(parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Juros (% ao dia)
                        <span className="text-xs text-muted-foreground ml-1">
                          após vencimento
                        </span>
                      </Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={juros}
                        onChange={(e) => setJuros(parseFloat(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Desconto (R$)
                        <span className="text-xs text-muted-foreground ml-1">
                          opcional
                        </span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={desconto || ''}
                        onChange={(e) =>
                          setDesconto(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Instruções para o Banco</Label>
                    <Textarea
                      rows={3}
                      value={instrucoes}
                      onChange={(e) => setInstrucoes(e.target.value)}
                      placeholder="Ex: Não receber após o vencimento"
                    />
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Resumo</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Valor:</span>
                        <span>R$ {valor.toFixed(2)}</span>
                      </div>
                      {desconto && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>- R$ {desconto.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Multa após vencimento:</span>
                        <span>{multa}% = R$ {(valor * (multa / 100)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Juros por dia:</span>
                        <span>{juros}% = R$ {(valor * (juros / 100)).toFixed(2)}/dia</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Boleto
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informações do Boleto */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Nosso Número:</span>
                <span className="font-mono font-semibold">{boleto.nossoNumero}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Vencimento:</span>
                <span className="font-medium">
                  {format(boleto.dataVencimento, 'dd/MM/yyyy')}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor Original:</span>
                <span className="font-bold text-lg text-green-600">
                  R$ {boleto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {boleto.status === 'vencido' && (
                <div className="flex items-center justify-between text-sm border-t pt-3">
                  <span className="text-muted-foreground">Valor com Encargos:</span>
                  <span className="font-bold text-lg text-orange-600">
                    R${' '}
                    {calcularValorComEncargos().toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Emitido:</span>
                <span>
                  {formatDistanceToNow(boleto.dataEmissao, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {boleto.pagador && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-semibold mb-2">Informações do Pagamento</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pagador:</span>
                        <span>{boleto.pagador.nome}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CPF/CNPJ:</span>
                        <span className="font-mono">{boleto.pagador.cpfCnpj}</span>
                      </div>
                      {boleto.pagador.dataPagamento && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Data do Pagamento:</span>
                            <span>
                              {format(boleto.pagador.dataPagamento, 'dd/MM/yyyy')}
                            </span>
                          </div>
                          {boleto.valorPago && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Valor Pago:</span>
                              <span className="font-bold text-green-600">
                                R${' '}
                                {boleto.valorPago.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Linha Digitável */}
            {(boleto.status === 'registrado' || boleto.status === 'vencido') && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Linha Digitável
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={boleto.linhaDigitavel}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(boleto.linhaDigitavel)}
                    className={cn(copied && 'bg-green-500 text-white')}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600">Código copiado!</p>
                )}
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {(boleto.status === 'registrado' || boleto.status === 'vencido') && (
                <>
                  <Button
                    variant="outline"
                    onClick={downloadPdf}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>

                  {clienteEmail && (
                    <Button
                      variant="outline"
                      onClick={handleSendByEmail}
                      disabled={isLoading}
                      className={cn('flex-1', emailSent && 'bg-green-500 text-white')}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {emailSent ? 'Enviado!' : 'Enviar por Email'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={checkStatus}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
                    />
                    Verificar
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={cancelBoleto}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </>
              )}

              {boleto.status === 'pago' && (
                <Alert className="border-green-500 bg-green-50 w-full">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Boleto pago! O recebimento foi registrado automaticamente.
                  </AlertDescription>
                </Alert>
              )}

              {boleto.status === 'cancelado' && (
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Novo Boleto
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
