'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { integrationService } from '@/services/integration';

export default function MercadoLivreCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage('Autorização cancelada ou negada');
        setTimeout(() => router.push('/admin/integracoes'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('Código de autorização não encontrado');
        setTimeout(() => router.push('/admin/integracoes'), 3000);
        return;
      }

      try {
        const result = await integrationService.connectMercadoLivre(code);

        if (result.success) {
          setStatus('success');
          setMessage(`Mercado Livre conectado com sucesso! User ID: ${result.user_id}`);
          setTimeout(() => router.push('/admin/integracoes'), 2000);
        } else {
          setStatus('error');
          setMessage('Erro ao processar autenticação');
          setTimeout(() => router.push('/admin/integracoes'), 3000);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setStatus('error');
        setMessage(errorMessage);
        setTimeout(() => router.push('/admin/integracoes'), 3000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            {status === 'loading' && 'Conectando...'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Erro'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{message}</p>
          {status !== 'loading' && (
            <p className="text-xs text-muted-foreground mt-4">
              Redirecionando em alguns segundos...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
