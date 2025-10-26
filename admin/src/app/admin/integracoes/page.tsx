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

export default function IntegracoesPage() {
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

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      setLoadingPage(true);
      const config = await integrationService.getShopifyConfig();

      setShopifyConfig({
        store_url: config.store_url || '',
        api_key: '', // Nunca retorna a API key por segurança
      });

      setHasShopifyConfig(config.has_api_key);
      setLastSync(config.last_sync);

      if (config.has_api_key) {
        setConnectionStatus('connected');
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
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configurações');
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
    } catch (error: any) {
      toast.error('Erro ao testar conexão', {
        description: error.message,
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
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover integração');
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

      {/* Placeholder para futuras integrações */}
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Mercado Livre</CardTitle>
              <CardDescription>
                Em breve - Sincronize vendas do Mercado Livre
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
