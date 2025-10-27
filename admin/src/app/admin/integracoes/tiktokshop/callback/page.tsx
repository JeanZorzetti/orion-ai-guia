'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { integrationService } from '@/services/integration';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function TikTokShopCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autorização TikTok Shop...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        if (!searchParams) {
          setStatus('error');
          setMessage('Parâmetros de autorização ausentes');
          toast.error('Erro ao processar callback OAuth');
          return;
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state'); // shop_id

        if (!code || !state) {
          setStatus('error');
          setMessage('Parâmetros de autorização inválidos');
          toast.error('Erro ao processar callback OAuth');
          return;
        }

        // Processar callback
        const result = await integrationService.processTikTokShopCallback(code, state);

        if (result.success) {
          setStatus('success');
          setMessage(`TikTok Shop conectado com sucesso! Shop ID: ${result.shop_id}`);
          toast.success('TikTok Shop conectado com sucesso!');

          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push('/admin/integracoes');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Erro ao conectar com TikTok Shop');
          toast.error('Erro ao processar autorização');
        }
      } catch (error) {
        setStatus('error');
        const errorMessage = error instanceof Error ? error.message : 'Erro ao processar callback OAuth';
        setMessage(errorMessage);
        toast.error('Erro ao conectar com TikTok Shop');
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center space-y-4">
          {status === 'processing' && (
            <>
              <Loader2 className="h-16 w-16 text-pink-600 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900">Processando...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Sucesso!</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Erro</h2>
            </>
          )}

          <p className="text-center text-gray-600">{message}</p>

          {status === 'success' && (
            <p className="text-sm text-gray-500">Redirecionando para Integrações...</p>
          )}

          {status === 'error' && (
            <button
              onClick={() => router.push('/admin/integracoes')}
              className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Voltar para Integrações
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TikTokShopCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-16 w-16 text-pink-600 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900">Carregando...</h2>
          </div>
        </div>
      </div>
    }>
      <TikTokShopCallbackContent />
    </Suspense>
  );
}
