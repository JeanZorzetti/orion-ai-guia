'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plug, CheckCircle, AlertTriangle, Loader2, ShoppingBag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { integrationService, type ShopifyConfig } from '@/services/integration';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function IntegracoesContent() {
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [testing, setTesting] = useState(false);

  const [shopifyConfig, setShopifyConfig] = useState<ShopifyConfig>({
    store_url: '',
    api_key: '',
  });

  const [hasShopifyConfig, setHasShopifyConfig] = useState(false);
  const [lastSync, setLastSync] = useState<string | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // Mercado Livre
  const [mlUserId, setMlUserId] = useState<string | undefined>();
  const [mlLastSync, setMlLastSync] = useState<string | undefined>();
  const [mlConnectionStatus, setMlConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    // Verificar se há token antes de tentar carregar
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Nenhum token encontrado. Faça login para acessar as integrações.');
      setLoadingPage(false);
      return;
    }

    try {
      setLoadingPage(true);

      // Carregar Shopify
      const shopifyConfig = await integrationService.getShopifyConfig();
      setShopifyConfig({
        store_url: shopifyConfig.store_url || '',
        api_key: '',
      });
      setHasShopifyConfig(shopifyConfig.has_api_key);
      setLastSync(shopifyConfig.last_sync);
      if (shopifyConfig.has_api_key) {
        setConnectionStatus('connected');
      }

      // Carregar Mercado Livre
      const mlConfig = await integrationService.getMercadoLivreConfig();
      setMlUserId(mlConfig.user_id);
      setMlLastSync(mlConfig.last_sync);
      if (mlConfig.has_token) {
        setMlConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleSaveShopify(e: React.FormEvent) {
    e.preventDefault();

    if (!shopifyConfig.store_url || !shopifyConfig.api_key) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      await integrationService.saveShopifyConfig(shopifyConfig);
      toast.success('Configurações Shopify salvas com sucesso!');
      await loadConfigs();
      setConnectionStatus('connected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      toast.error(errorMessage);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    if (!hasShopifyConfig) {
      toast.error('Configure primeiro as credenciais Shopify');
      return;
    }

    setTesting(true);

    try {
      const result = await integrationService.testShopifyConnection();

      if (result.success) {
        toast.success(`Conexão bem-sucedida!`, {
          description: `Loja: ${result.shop_name}`,
        });
        setConnectionStatus('connected');
      } else {
        toast.error('Erro ao testar conexão', {
          description: result.error,
        });
        setConnectionStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
      toast.error('Erro ao testar conexão', {
        description: errorMessage,
      });
      setConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteShopify() {
    if (!confirm('Tem certeza que deseja remover a integração com Shopify?')) {
      return;
    }

    setLoading(true);

    try {
      await integrationService.deleteShopifyConfig();
      toast.success('Integração Shopify removida com sucesso');
      setShopifyConfig({ store_url: '', api_key: '' });
      setHasShopifyConfig(false);
      setConnectionStatus('disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover integração';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // ========== MERCADO LIVRE ==========

  async function handleConnectMercadoLivre() {
    try {
      const { auth_url } = await integrationService.getMercadoLivreAuthUrl();
      // Redirecionar para autorização do ML
      window.location.href = auth_url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao obter URL de autorização';
      toast.error(errorMessage);
    }
  }

  async function handleTestMercadoLivre() {
    setTesting(true);
    try {
      const result = await integrationService.testMercadoLivreConnection();
      if (result.success) {
        toast.success('Conexão bem-sucedida!', {
          description: `User ID: ${result.user_id}`,
        });
        setMlConnectionStatus('connected');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
      toast.error(errorMessage);
      setMlConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteMercadoLivre() {
    if (!confirm('Tem certeza que deseja desconectar o Mercado Livre?')) {
      return;
    }

    setLoading(true);
    try {
      await integrationService.deleteMercadoLivreConfig();
      toast.success('Mercado Livre desconectado');
      setMlUserId(undefined);
      setMlConnectionStatus('disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desconectar';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Plug className="h-8 w-8" />
            Integrações
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecte sua loja com canais de venda para importar pedidos automaticamente
          </p>
        </div>
      </div>

      <Alert>
        <Plug className="h-4 w-4" />
        <AlertDescription>
          Integre com Shopify, Mercado Livre e outros canais de venda para sincronizar
          pedidos automaticamente. Os pedidos importados serão convertidos em vendas no Orion ERP.
        </AlertDescription>
      </Alert>

      {/* Card Shopify */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Shopify</CardTitle>
                <CardDescription>
                  Sincronize pedidos da sua loja Shopify
                </CardDescription>
              </div>
            </div>

            <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'error' ? 'destructive' : 'secondary'}>
              {connectionStatus === 'connected' && (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Conectado
                </>
              )}
              {connectionStatus === 'error' && (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Erro na Conexão
                </>
              )}
              {connectionStatus === 'disconnected' && 'Desconectado'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveShopify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store_url">
                URL da Loja Shopify <span className="text-destructive">*</span>
              </Label>
              <Input
                id="store_url"
                value={shopifyConfig.store_url}
                onChange={(e) => setShopifyConfig({ ...shopifyConfig, store_url: e.target.value })}
                placeholder="minhaloja.myshopify.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: minhaloja.myshopify.com (sem https://)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">
                Admin API Access Token <span className="text-destructive">*</span>
              </Label>
              <Input
                id="api_key"
                type="password"
                value={shopifyConfig.api_key}
                onChange={(e) => setShopifyConfig({ ...shopifyConfig, api_key: e.target.value })}
                placeholder="shpat_..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Token de acesso da Admin API. Obtido em: Apps {'>'} Develop apps {'>'} Create an app
              </p>
            </div>

            {lastSync && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasShopifyConfig ? 'Atualizar Credenciais' : 'Salvar e Conectar'}
              </Button>

              {hasShopifyConfig && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Conexão
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteShopify}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Como obter as credenciais Shopify:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acesse o admin da sua loja Shopify</li>
              <li>Vá em <strong>Apps</strong> → <strong>Develop apps</strong></li>
              <li>Clique em <strong>Create an app</strong></li>
              <li>Configure as permissões: <code>read_orders</code>, <code>read_products</code></li>
              <li>Instale o app e copie o <strong>Admin API access token</strong></li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Card Mercado Livre */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <ShoppingBag className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle>Mercado Livre</CardTitle>
                <CardDescription>
                  Sincronize pedidos do maior marketplace do Brasil
                </CardDescription>
              </div>
            </div>

            <Badge variant={mlConnectionStatus === 'connected' ? 'default' : mlConnectionStatus === 'error' ? 'destructive' : 'secondary'}>
              {mlConnectionStatus === 'connected' && (
                <>
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Conectado
                </>
              )}
              {mlConnectionStatus === 'error' && (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Erro
                </>
              )}
              {mlConnectionStatus === 'disconnected' && 'Desconectado'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {mlUserId ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Conectado - User ID: {mlUserId}
                    {mlLastSync && (
                      <><br />Última sincronização: {new Date(mlLastSync).toLocaleString('pt-BR')}</>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestMercadoLivre}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Conexão
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteMercadoLivre}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Conecte sua conta do Mercado Livre para sincronizar pedidos automaticamente.
                  Você será redirecionado para autorizar o acesso.
                </p>

                <Button onClick={handleConnectMercadoLivre} className="w-full">
                  Conectar com Mercado Livre
                </Button>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Como conectar:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Clique em &quot;Conectar com Mercado Livre&quot;</li>
                    <li>Você será redirecionado para o site do Mercado Livre</li>
                    <li>Faça login e autorize o acesso</li>
                    <li>Será redirecionado de volta automaticamente</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function IntegracoesPage() {
  return (
    <ProtectedRoute>
      <IntegracoesContent />
    </ProtectedRoute>
  );
}
