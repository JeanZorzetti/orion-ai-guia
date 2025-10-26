'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, CheckCircle, AlertTriangle, Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fiscalService } from '@/services/fiscal';
import type { FiscalConfig, CertificateStatus } from '@/types/fiscal';

export default function FiscalConfigPage() {
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [config, setConfig] = useState<FiscalConfig>({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    inscricao_municipal: '',
    regime_tributario: 1,
    fiscal_cep: '',
    fiscal_logradouro: '',
    fiscal_numero: '',
    fiscal_complemento: '',
    fiscal_bairro: '',
    fiscal_cidade: '',
    fiscal_uf: '',
    fiscal_codigo_municipio: '',
    fiscal_partner: 'plugnotas',
    fiscal_partner_api_key: '',
    nfe_serie: 1,
    nfe_ambiente: 2,
  });

  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus>('not_uploaded');
  const [certificateExpiresAt, setCertificateExpiresAt] = useState<string | undefined>();

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      setLoadingPage(true);
      const data = await fiscalService.getConfig();
      setConfig({
        ...data,
        fiscal_partner_api_key: '', // Nunca retorna a API key por segurança
      });
      setCertificateStatus(data.certificate_status || 'not_uploaded');
      setCertificateExpiresAt(data.certificate_expires_at);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Não mostrar toast de erro no carregamento inicial (pode não ter config ainda)
    } finally {
      setLoadingPage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validações
    if (!fiscalService.validateCNPJ(config.cnpj)) {
      toast.error('CNPJ inválido');
      return;
    }

    if (!config.fiscal_partner_api_key) {
      toast.error('A API Key do parceiro fiscal é obrigatória');
      return;
    }

    setLoading(true);

    try {
      await fiscalService.updateConfig(config);
      toast.success('Configurações fiscais salvas com sucesso!');
      await loadConfig(); // Recarregar para pegar status atualizado
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleCertificateUpload(file: File) {
    const formData = new FormData();
    formData.append('certificate', file);

    try {
      setLoading(true);
      await fiscalService.uploadCertificate(formData);
      toast.success('Certificado enviado com sucesso!');
      await loadConfig(); // Recarregar status
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar certificado';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const ufs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações Fiscais</h1>
          <p className="text-muted-foreground mt-1">
            Configure a emissão de notas fiscais eletrônicas (NF-e)
          </p>
        </div>

        <Badge variant={certificateStatus === 'active' ? 'default' : 'destructive'}>
          {certificateStatus === 'active' ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              Certificado Ativo
            </>
          ) : certificateStatus === 'expired' ? (
            <>
              <AlertTriangle className="mr-1 h-3 w-3" />
              Certificado Expirado
            </>
          ) : (
            <>
              <AlertTriangle className="mr-1 h-3 w-3" />
              Sem Certificado
            </>
          )}
        </Badge>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Suas credenciais fiscais são criptografadas e armazenadas com segurança.
          Utilizamos parceiros certificados pela SEFAZ para emissão de notas.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="empresa" className="space-y-4">
          <TabsList>
            <TabsTrigger value="empresa">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="integracao">Integração Fiscal</TabsTrigger>
            <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
          </TabsList>

          <TabsContent value="empresa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Dados que aparecerão nas notas fiscais emitidas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      value={config.cnpj}
                      onChange={(e) => setConfig({ ...config, cnpj: e.target.value.replace(/\D/g, '') })}
                      placeholder="00000000000000"
                      maxLength={14}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.cnpj && fiscalService.formatCNPJ(config.cnpj)}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="ie">Inscrição Estadual *</Label>
                    <Input
                      id="ie"
                      value={config.inscricao_estadual}
                      onChange={(e) => setConfig({ ...config, inscricao_estadual: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="razao">Razão Social *</Label>
                  <Input
                    id="razao"
                    value={config.razao_social}
                    onChange={(e) => setConfig({ ...config, razao_social: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="fantasia">Nome Fantasia</Label>
                  <Input
                    id="fantasia"
                    value={config.nome_fantasia}
                    onChange={(e) => setConfig({ ...config, nome_fantasia: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="regime">Regime Tributário *</Label>
                  <Select
                    value={config.regime_tributario.toString()}
                    onValueChange={(v) => setConfig({ ...config, regime_tributario: parseInt(v) as 1 | 2 | 3 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Simples Nacional</SelectItem>
                      <SelectItem value="2">Simples Nacional - Excesso de Sublimite</SelectItem>
                      <SelectItem value="3">Regime Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Endereço Fiscal */}
                <div className="border-t pt-4 mt-6">
                  <h3 className="font-semibold mb-4">Endereço Fiscal</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Label>Logradouro *</Label>
                      <Input
                        value={config.fiscal_logradouro}
                        onChange={(e) => setConfig({ ...config, fiscal_logradouro: e.target.value })}
                        placeholder="Rua, Avenida, etc."
                        required
                      />
                    </div>
                    <div>
                      <Label>Número *</Label>
                      <Input
                        value={config.fiscal_numero}
                        onChange={(e) => setConfig({ ...config, fiscal_numero: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Complemento</Label>
                      <Input
                        value={config.fiscal_complemento}
                        onChange={(e) => setConfig({ ...config, fiscal_complemento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bairro *</Label>
                      <Input
                        value={config.fiscal_bairro}
                        onChange={(e) => setConfig({ ...config, fiscal_bairro: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Cidade *</Label>
                      <Input
                        value={config.fiscal_cidade}
                        onChange={(e) => setConfig({ ...config, fiscal_cidade: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>UF *</Label>
                      <Select
                        value={config.fiscal_uf}
                        onValueChange={(v) => setConfig({ ...config, fiscal_uf: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ufs.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CEP *</Label>
                      <Input
                        value={config.fiscal_cep}
                        onChange={(e) => setConfig({ ...config, fiscal_cep: e.target.value.replace(/\D/g, '') })}
                        placeholder="00000000"
                        maxLength={8}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {config.fiscal_cep && fiscalService.formatCEP(config.fiscal_cep)}
                      </p>
                    </div>
                    <div>
                      <Label>Código IBGE do Município *</Label>
                      <Input
                        value={config.fiscal_codigo_municipio}
                        onChange={(e) => setConfig({ ...config, fiscal_codigo_municipio: e.target.value })}
                        placeholder="7 dígitos"
                        maxLength={7}
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parceiro de Emissão Fiscal</CardTitle>
                <CardDescription>
                  Configurações de integração com a API de notas fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Parceiro *</Label>
                  <Select
                    value={config.fiscal_partner}
                    onValueChange={(v) => setConfig({ ...config, fiscal_partner: v as 'plugnotas' | 'focusnfe' | 'nfeio' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plugnotas">PlugNotas</SelectItem>
                      <SelectItem value="focusnfe">FocusNFe</SelectItem>
                      <SelectItem value="nfeio">NFe.io</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="apikey">API Key *</Label>
                  <Input
                    id="apikey"
                    type="password"
                    value={config.fiscal_partner_api_key}
                    onChange={(e) => setConfig({ ...config, fiscal_partner_api_key: e.target.value })}
                    placeholder="Sua API key do parceiro"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtida no painel do {config.fiscal_partner}. Será armazenada criptografada.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Série da NF-e</Label>
                    <Input
                      type="number"
                      value={config.nfe_serie}
                      onChange={(e) => setConfig({ ...config, nfe_serie: parseInt(e.target.value) || 1 })}
                      min={1}
                      max={999}
                    />
                  </div>
                  <div>
                    <Label>Ambiente</Label>
                    <Select
                      value={config.nfe_ambiente.toString()}
                      onValueChange={(v) => setConfig({ ...config, nfe_ambiente: parseInt(v) as 1 | 2 })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">Homologação (Testes)</SelectItem>
                        <SelectItem value="1">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Use o ambiente de <strong>Homologação</strong> para testes. Troque para <strong>Produção</strong> apenas quando estiver pronto.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificado">
            <Card>
              <CardHeader>
                <CardTitle>Certificado Digital A1</CardTitle>
                <CardDescription>
                  Upload do certificado digital para assinatura das notas fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    O certificado digital A1 (.pfx) é obrigatório para emissão de NF-e.
                    Ele será enviado diretamente para o parceiro fiscal e não ficará armazenado em nossos servidores.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="certificate" className="cursor-pointer">
                    <div className="text-sm font-medium mb-2">
                      Clique para selecionar o certificado A1
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Arquivo .pfx ou .p12
                    </div>
                  </Label>
                  <Input
                    id="certificate"
                    type="file"
                    accept=".pfx,.p12"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleCertificateUpload(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {certificateStatus === 'active' && certificateExpiresAt && (
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Certificado Ativo
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Expira em: {new Date(certificateExpiresAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {certificateStatus === 'expired' && (
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">
                          Certificado Expirado
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Faça o upload de um novo certificado para continuar emitindo notas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={loadConfig} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
