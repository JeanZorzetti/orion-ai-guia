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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateSupplierAccess } from '@/hooks/useSupplierPortal';
import { Copy, Check, ExternalLink, Calendar, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenerateSupplierAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedorId: string;
  fornecedorNome: string;
}

export const GenerateSupplierAccessDialog: React.FC<GenerateSupplierAccessDialogProps> = ({
  open,
  onOpenChange,
  fornecedorId,
  fornecedorNome,
}) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [accessUrl, setAccessUrl] = useState('');
  const [expiracaoDias, setExpiracaoDias] = useState('90');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const dias = parseInt(expiracaoDias) || 90;
      const dataExpiracao = addDays(new Date(), dias);

      const access = await generateSupplierAccess(fornecedorId, fornecedorNome, dataExpiracao);

      // Gerar URL do portal
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/portal/fornecedor/${access.token}`;
      setAccessUrl(url);
      setGenerated(true);

      // TODO: Mostrar toast de sucesso
    } catch (error) {
      console.error('Erro ao gerar acesso:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPortal = () => {
    window.open(accessUrl, '_blank');
  };

  const handleClose = () => {
    setGenerated(false);
    setAccessUrl('');
    setCopied(false);
    setExpiracaoDias('90');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerar Acesso ao Portal do Fornecedor</DialogTitle>
          <DialogDescription>
            Crie um link de acesso seguro para <strong>{fornecedorNome}</strong> consultar suas
            faturas e pagamentos.
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                O link gerado permitirá que o fornecedor acesse todas as informações de suas faturas,
                incluindo status de aprovação e datas de pagamento.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="expiracao">Validade do Acesso (dias)</Label>
              <Input
                id="expiracao"
                type="number"
                value={expiracaoDias}
                onChange={(e) => setExpiracaoDias(e.target.value)}
                placeholder="90"
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground">
                O acesso expirará em:{' '}
                {format(
                  addDays(new Date(), parseInt(expiracaoDias) || 90),
                  "dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR }
                )}
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">O que o fornecedor poderá ver:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Resumo financeiro (total a receber, pago no mês)</li>
                <li>Lista completa de faturas e status</li>
                <li>Datas de vencimento e pagamento</li>
                <li>Status de aprovação de cada fatura</li>
                <li>Histórico de pagamentos dos últimos 6 meses</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Link de acesso gerado com sucesso!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Link de Acesso</Label>
              <div className="flex gap-2">
                <Input value={accessUrl} readOnly className="font-mono text-sm" />
                <Button onClick={handleCopy} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Link copiado para a área de transferência!
                </p>
              )}
            </div>

            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Este link expirará em{' '}
                {format(
                  addDays(new Date(), parseInt(expiracaoDias) || 90),
                  "dd 'de' MMMM 'de' yyyy",
                  { locale: ptBR }
                )}
                . Após essa data, será necessário gerar um novo acesso.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Próximos passos:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Copie o link acima</li>
                <li>Envie o link por e-mail para o fornecedor</li>
                <li>O fornecedor poderá acessar o portal diretamente pelo link</li>
                <li>O acesso é único e seguro para este fornecedor</li>
              </ol>
            </div>
          </div>
        )}

        <DialogFooter>
          {!generated ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? 'Gerando...' : 'Gerar Link de Acesso'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleOpenPortal}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Testar Portal
              </Button>
              <Button onClick={handleClose}>Concluir</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
