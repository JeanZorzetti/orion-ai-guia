'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plug, CheckCircle, AlertTriangle, Loader2, ShoppingBag, Trash2, Store, Video } from 'lucide-react';
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

  // Mercado Livre
  const [mlUserId, setMlUserId] = useState<string | undefined>();
  const [mlLastSync, setMlLastSync] = useState<string | undefined>();
  const [mlConnectionStatus, setMlConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // WooCommerce
  const [wcStoreUrl, setWcStoreUrl] = useState('');
  const [wcConsumerKey, setWcConsumerKey] = useState('');
  const [wcConsumerSecret, setWcConsumerSecret] = useState('');
  const [wcLastSync, setWcLastSync] = useState<string | undefined>();
  const [wcConnectionStatus, setWcConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // Magalu
  const [magaluSellerId, setMagaluSellerId] = useState('');
  const [magaluApiKey, setMagaluApiKey] = useState('');
  const [magaluLastSync, setMagaluLastSync] = useState<string | undefined>();
  const [magaluConnectionStatus, setMagaluConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // TikTok Shop
  const [tiktokShopId, setTiktokShopId] = useState('');
  const [tiktokLastSync, setTiktokLastSync] = useState<string | undefined>();
  const [tiktokConnectionStatus, setTiktokConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [tiktokTokenExpires, setTiktokTokenExpires] = useState<string | undefined>();

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
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

      // Carregar WooCommerce
      const wcConfig = await integrationService.getWooCommerceConfig();
      setWcStoreUrl(wcConfig.store_url || '');
      setWcLastSync(wcConfig.last_sync || undefined);
      if (wcConfig.connected) {
        setWcConnectionStatus('connected');
      }

      // Carregar Magalu
      const magaluConfig = await integrationService.getMagaluConfig();
      setMagaluSellerId(magaluConfig.seller_id || '');
      setMagaluLastSync(magaluConfig.last_sync || undefined);
      if (magaluConfig.connected) {
        setMagaluConnectionStatus('connected');
      }

      // Carregar TikTok Shop
      const tiktokConfig = await integrationService.getTikTokShopConfig();
      setTiktokShopId(tiktokConfig.shop_id || '');
      setTiktokLastSync(tiktokConfig.last_sync || undefined);
      setTiktokTokenExpires(tiktokConfig.token_expires_at || undefined);
      if (tiktokConfig.connected) {
        setTiktokConnectionStatus('connected');
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

  // ========== WOOCOMMERCE ==========

  async function handleSaveWooCommerce(e: React.FormEvent) {
    e.preventDefault();

    if (!wcStoreUrl || !wcConsumerKey || !wcConsumerSecret) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await integrationService.saveWooCommerceConfig(wcStoreUrl, wcConsumerKey, wcConsumerSecret);
      toast.success('WooCommerce configurado com sucesso!');
      setWcConsumerKey('');
      setWcConsumerSecret('');
      await loadConfigs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao configurar WooCommerce';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestWooCommerce() {
    setTesting(true);
    try {
      const result = await integrationService.testWooCommerceConnection();
      if (result.success) {
        toast.success('Conexão bem-sucedida!', {
          description: `Loja: ${result.store_name || 'WooCommerce'} (v${result.wc_version || 'Unknown'})`,
        });
        setWcConnectionStatus('connected');
      } else {
        toast.error(result.message);
        setWcConnectionStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
      toast.error(errorMessage);
      setWcConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteWooCommerce() {
    if (!confirm('Tem certeza que deseja desconectar o WooCommerce?')) {
      return;
    }

    setLoading(true);
    try {
      await integrationService.deleteWooCommerceConfig();
      toast.success('WooCommerce desconectado');
      setWcStoreUrl('');
      setWcConsumerKey('');
      setWcConsumerSecret('');
      setWcConnectionStatus('disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desconectar';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // ========== MAGALU ==========

  async function handleSaveMagalu(e: React.FormEvent) {
    e.preventDefault();

    if (!magaluSellerId || !magaluApiKey) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await integrationService.saveMagaluConfig(magaluSellerId, magaluApiKey);
      toast.success('Magalu configurado com sucesso!');
      setMagaluApiKey('');
      await loadConfigs();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao configurar Magalu';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestMagalu() {
    setTesting(true);
    try {
      const result = await integrationService.testMagaluConnection();
      if (result.success) {
        toast.success('Conexão bem-sucedida!', {
          description: `Seller: ${result.seller_name || magaluSellerId}`,
        });
        setMagaluConnectionStatus('connected');
      } else {
        toast.error(result.message);
        setMagaluConnectionStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
      toast.error(errorMessage);
      setMagaluConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteMagalu() {
    if (!confirm('Tem certeza que deseja desconectar o Magalu?')) {
      return;
    }

    setLoading(true);
    try {
      await integrationService.deleteMagaluConfig();
      toast.success('Magalu desconectado');
      setMagaluSellerId('');
      setMagaluApiKey('');
      setMagaluConnectionStatus('disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao desconectar';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // ========== TIKTOK SHOP ==========

  async function handleConnectTikTok() {
    if (!tiktokShopId) {
      toast.error('Digite o Shop ID');
      return;
    }

    setLoading(true);
    try {
      const result = await integrationService.getTikTokShopAuthUrl(tiktokShopId);
      // Redirecionar para a URL de autorização OAuth
      window.location.href = result.auth_url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar';
      toast.error(errorMessage);
      setLoading(false);
    }
  }

  async function handleTestTikTok() {
    setTesting(true);
    try {
      const result = await integrationService.testTikTokShopConnection();
      if (result.success) {
        toast.success('Conexão bem-sucedida!', {
          description: result.shop_name ? `Loja: ${result.shop_name}` : 'TikTok Shop conectado',
        });
        setTiktokConnectionStatus('connected');
      } else {
        toast.error(result.message);
        setTiktokConnectionStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao testar conexão';
      toast.error(errorMessage);
      setTiktokConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  }

  async function handleDeleteTikTok() {
    if (!confirm('Tem certeza que deseja desconectar o TikTok Shop?')) {
      return;
    }

    setLoading(true);
    try {
      await integrationService.deleteTikTokShopConfig();
      toast.success('TikTok Shop desconectado');
      setTiktokShopId('');
      setTiktokConnectionStatus('disconnected');
      setTiktokTokenExpires(undefined);
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

      {/* WooCommerce Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>WooCommerce</CardTitle>
                <CardDescription>Plataforma de e-commerce WordPress</CardDescription>
              </div>
            </div>
            {wcConnectionStatus === 'connected' && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="mr-1 h-3 w-3" />
                Conectado
              </Badge>
            )}
            {wcConnectionStatus === 'error' && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Erro
              </Badge>
            )}
            {wcConnectionStatus === 'disconnected' && (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {wcConnectionStatus === 'connected' ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    WooCommerce conectado com sucesso
                    {wcStoreUrl && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Loja: {wcStoreUrl}
                      </div>
                    )}
                    {wcLastSync && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Última sincronização: {new Date(wcLastSync).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestWooCommerce}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Conexão
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteWooCommerce}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleSaveWooCommerce} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wc_store_url">
                      URL da Loja <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wc_store_url"
                      type="url"
                      value={wcStoreUrl}
                      onChange={(e) => setWcStoreUrl(e.target.value)}
                      placeholder="https://minhaloja.com.br"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL completa da sua loja WooCommerce
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wc_consumer_key">
                      Consumer Key <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wc_consumer_key"
                      type="text"
                      value={wcConsumerKey}
                      onChange={(e) => setWcConsumerKey(e.target.value)}
                      placeholder="ck_..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wc_consumer_secret">
                      Consumer Secret <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wc_consumer_secret"
                      type="password"
                      value={wcConsumerSecret}
                      onChange={(e) => setWcConsumerSecret(e.target.value)}
                      placeholder="cs_..."
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar e Conectar
                  </Button>
                </form>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Como obter as credenciais:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse o painel admin do WordPress</li>
                    <li>Vá em WooCommerce {'>'} Configurações {'>'} Avançado {'>'} REST API</li>
                    <li>Clique em &quot;Adicionar chave&quot;</li>
                    <li>Defina permissões como &quot;Leitura/Escrita&quot;</li>
                    <li>Copie a Consumer Key e Consumer Secret geradas</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Magalu Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Magazine Luiza (Magalu)</CardTitle>
                <CardDescription>3º maior marketplace do Brasil</CardDescription>
              </div>
            </div>
            {magaluConnectionStatus === 'connected' && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <CheckCircle className="mr-1 h-3 w-3" />
                Conectado
              </Badge>
            )}
            {magaluConnectionStatus === 'error' && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Erro
              </Badge>
            )}
            {magaluConnectionStatus === 'disconnected' && (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {magaluConnectionStatus === 'connected' ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Magalu conectado com sucesso
                    {magaluSellerId && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Seller ID: {magaluSellerId}
                      </div>
                    )}
                    {magaluLastSync && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Última sincronização: {new Date(magaluLastSync).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestMagalu}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Conexão
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteMagalu}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleSaveMagalu} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magalu_seller_id">
                      Seller ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="magalu_seller_id"
                      type="text"
                      value={magaluSellerId}
                      onChange={(e) => setMagaluSellerId(e.target.value)}
                      placeholder="12345"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ID do seller fornecido pelo Magalu Marketplace
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="magalu_api_key">
                      API Key <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="magalu_api_key"
                      type="password"
                      value={magaluApiKey}
                      onChange={(e) => setMagaluApiKey(e.target.value)}
                      placeholder="sua-api-key"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Chave de API fornecida pelo Magalu
                    </p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar e Conectar
                  </Button>
                </form>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Como obter as credenciais:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse o Magalu Marketplace Seller Center</li>
                    <li>Vá em Configurações {'>'} Integrações</li>
                    <li>Gere uma nova API Key</li>
                    <li>Anote o Seller ID e a API Key</li>
                    <li>Cole as credenciais nos campos acima</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* TikTok Shop Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Video className="h-6 w-6 text-pink-600" />
            </div>
            <CardTitle>TikTok Shop</CardTitle>
          </div>
          <CardDescription>Conecte sua loja TikTok Shop via OAuth 2.0</CardDescription>
          <div className="mt-2 flex gap-2">
            {tiktokConnectionStatus === 'connected' && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Conectado
              </Badge>
            )}
            {tiktokConnectionStatus === 'error' && (
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Erro
              </Badge>
            )}
            {tiktokConnectionStatus === 'disconnected' && (
              <Badge variant="secondary">Desconectado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tiktokConnectionStatus === 'connected' ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    TikTok Shop conectado com sucesso
                    {tiktokShopId && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Shop ID: {tiktokShopId}
                      </div>
                    )}
                    {tiktokLastSync && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Última sincronização: {new Date(tiktokLastSync).toLocaleString('pt-BR')}
                      </div>
                    )}
                    {tiktokTokenExpires && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Token expira em: {new Date(tiktokTokenExpires).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestTikTok}
                    disabled={testing}
                  >
                    {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Testar Conexão
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteTikTok}
                    disabled={loading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_shop_id">
                      Shop ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tiktok_shop_id"
                      type="text"
                      value={tiktokShopId}
                      onChange={(e) => setTiktokShopId(e.target.value)}
                      placeholder="12345678"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      ID da sua loja no TikTok Shop
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectTikTok}
                    disabled={loading || !tiktokShopId}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Conectar com OAuth
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2 text-sm">Como conectar:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse o TikTok Shop Seller Center</li>
                    <li>Vá em Settings {'>'} Developer Tools</li>
                    <li>Encontre o Shop ID da sua loja</li>
                    <li>Digite o Shop ID acima</li>
                    <li>Clique em &quot;Conectar com OAuth&quot;</li>
                    <li>Autorize o aplicativo na página do TikTok</li>
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
