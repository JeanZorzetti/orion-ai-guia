'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  QrCode,
  Copy,
  Mail,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { usePixCharge } from '@/hooks/usePixCharge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PixIntegrationProps {
  contaReceberId: string;
  valor: number;
  clienteNome: string;
  clienteEmail?: string;
}

export const PixIntegration: React.FC<PixIntegrationProps> = ({
  contaReceberId,
  valor,
  clienteNome,
  clienteEmail,
}) => {
  const {
    charge,
    isLoading,
    isGenerating,
    error,
    generateCharge,
    checkStatus,
    cancelCharge,
  } = usePixCharge(contaReceberId);

  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Auto-refresh status a cada 10 segundos se a cobrança estiver ativa
  useEffect(() => {
    if (charge && charge.status === 'ativo') {
      const interval = setInterval(() => {
        checkStatus();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [charge, checkStatus]);

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
    if (!charge || !clienteEmail) return;

    // Simulação de envio de email
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const getStatusBadge = (status: 'ativo' | 'concluido' | 'expirado' | 'removido_pelo_usuario_recebedor') => {
    switch (status) {
      case 'ativo':
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Aguardando Pagamento
          </Badge>
        );
      case 'concluido':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pago
          </Badge>
        );
      case 'expirado':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Expirado
          </Badge>
        );
      case 'removido_pelo_usuario_recebedor':
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Pagamento via PIX
            </CardTitle>
            <CardDescription>
              Gere um QR Code PIX para pagamento instantâneo
            </CardDescription>
          </div>
          {charge && getStatusBadge(charge.status)}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!charge ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <span className="font-medium">{clienteNome}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor:</span>
                <span className="text-2xl font-bold text-green-600">
                  R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <Button
              onClick={() => generateCharge(contaReceberId, valor)}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando QR Code...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar QR Code PIX
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              O QR Code expira em 1 hora após a geração
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* QR Code Visual */}
            {charge.status === 'ativo' && (
              <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-dashed">
                <div className="text-center">
                  <div className="w-64 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center mb-3">
                    <QrCode className="h-32 w-32 text-gray-400" />
                    <div className="absolute">
                      <p className="text-xs text-gray-500">QR Code PIX</p>
                      <p className="text-xs text-gray-400 mt-1">
                        (Em produção: imagem real)
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Escaneie com o app do seu banco
                  </p>
                </div>
              </div>
            )}

            {/* Informações da Cobrança */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-lg text-green-600">
                  R$ {charge.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ID da Transação:</span>
                <span className="font-mono text-xs">{charge.txid}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Criado:</span>
                <span>
                  {formatDistanceToNow(charge.dataCriacao, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>

              {charge.status === 'ativo' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="text-orange-600 font-medium">
                    {formatDistanceToNow(charge.dataExpiracao, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}

              {charge.pagador && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <h4 className="text-sm font-semibold mb-2">Informações do Pagamento</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Pagador:</span>
                        <span>{charge.pagador.nome}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CPF/CNPJ:</span>
                        <span className="font-mono">{charge.pagador.cpfCnpj}</span>
                      </div>
                      {charge.pagador.dataPagamento && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Data do Pagamento:</span>
                          <span>
                            {formatDistanceToNow(charge.pagador.dataPagamento, {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* PIX Copia e Cola */}
            {charge.status === 'ativo' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  PIX Copia e Cola
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={charge.qrCode}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyToClipboard(charge.qrCode)}
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
            <div className="flex gap-2 pt-4 border-t">
              {charge.status === 'ativo' && (
                <>
                  <Button
                    variant="outline"
                    onClick={checkStatus}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <RefreshCw
                      className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')}
                    />
                    Verificar Status
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
                    variant="destructive"
                    onClick={cancelCharge}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </>
              )}

              {charge.status === 'concluido' && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Pagamento confirmado! O recebimento foi registrado automaticamente.
                  </AlertDescription>
                </Alert>
              )}

              {(charge.status === 'expirado' || charge.status === 'removido_pelo_usuario_recebedor') && (
                <Button
                  onClick={() => generateCharge(contaReceberId, valor)}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar Novo QR Code
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
