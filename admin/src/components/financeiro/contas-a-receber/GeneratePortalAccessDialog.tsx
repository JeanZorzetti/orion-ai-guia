'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Link2,
  Copy,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useGeneratePortalToken } from '@/hooks/useCustomerPortal';
import { cn } from '@/lib/utils';

interface GeneratePortalAccessDialogProps {
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
}

export const GeneratePortalAccessDialog: React.FC<GeneratePortalAccessDialogProps> = ({
  clienteId,
  clienteNome,
  clienteEmail: initialEmail,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { generateToken, isGenerating, error } = useGeneratePortalToken();

  const handleGenerate = async () => {
    const token = await generateToken(clienteId, email);
    if (token) {
      setGeneratedToken(token);
      // Simulação de envio de email
      setTimeout(() => {
        setEmailSent(true);
      }, 1500);
    }
  };

  const getPortalUrl = () => {
    if (typeof window === 'undefined' || !generatedToken) return '';
    return `${window.location.origin}/portal/cliente/${generatedToken}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPortalUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleOpenPortal = () => {
    window.open(getPortalUrl(), '_blank');
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedToken(null);
    setCopied(false);
    setEmailSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link2 className="h-4 w-4" />
          Gerar Acesso Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Gerar Acesso ao Portal do Cliente</DialogTitle>
          <DialogDescription>
            Crie um link de acesso seguro para {clienteNome} consultar seus títulos
          </DialogDescription>
        </DialogHeader>

        {!generatedToken ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Cliente</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com.br"
              />
              <p className="text-xs text-muted-foreground">
                Um email com o link de acesso será enviado automaticamente
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Sobre o Portal do Cliente
                  </p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                    <li>• Acesso seguro com token único</li>
                    <li>• Consulta de todos os títulos em aberto</li>
                    <li>• Geração de PIX e Boletos diretamente</li>
                    <li>• Download de notas fiscais</li>
                    <li>• Válido por 7 dias</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {emailSent && (
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  Email enviado com sucesso para {email}!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label>Link de Acesso Gerado</Label>
              <div className="flex gap-2">
                <Input
                  value={getPortalUrl()}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
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
                <p className="text-xs text-green-600">Link copiado!</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleOpenPortal}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Portal
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Simulação de reenvio de email
                  setEmailSent(false);
                  setTimeout(() => setEmailSent(true), 1500);
                }}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Reenviar Email
              </Button>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <span className="font-semibold">💡 Dica:</span> O cliente poderá
                acessar o portal pelos próximos 7 dias. Após esse período, será
                necessário gerar um novo link de acesso.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {!generatedToken ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !email}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Gerar Acesso
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
