'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  Building2,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';

const ConfiguracoesPage: React.FC = () => {
  const { settings, updateSettings, resetSettings, loading } = useCompanySettings();
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    companyLogo: settings.companyLogo || '',
    companySlogan: settings.companySlogan || '',
  });

  // Atualizar form quando settings carregar
  React.useEffect(() => {
    if (!loading) {
      setFormData({
        companyName: settings.companyName,
        companyLogo: settings.companyLogo || '',
        companySlogan: settings.companySlogan || '',
      });
    }
  }, [settings, loading]);

  const handleSave = () => {
    updateSettings({
      companyName: formData.companyName,
      companyLogo: formData.companyLogo || null,
      companySlogan: formData.companySlogan || null,
    });
    toast.success('Configurações salvas com sucesso!');
  };

  const handleReset = () => {
    resetSettings();
    setFormData({
      companyName: 'Orion ERP',
      companyLogo: '',
      companySlogan: 'Sistema de Gestão Empresarial',
    });
    toast.info('Configurações restauradas para o padrão');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, companyLogo: reader.result as string });
        toast.success('Logo carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalize a aparência e informações da empresa
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Configure o nome e slogan da empresa
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                placeholder="Digite o nome da empresa"
              />
              <p className="text-xs text-muted-foreground">
                Este nome aparecerá no header e nos relatórios
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySlogan">Slogan</Label>
              <Input
                id="companySlogan"
                value={formData.companySlogan}
                onChange={(e) =>
                  setFormData({ ...formData, companySlogan: e.target.value })
                }
                placeholder="Digite o slogan da empresa"
              />
              <p className="text-xs text-muted-foreground">
                Descrição breve que aparecerá nos relatórios
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo da Empresa */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <ImageIcon className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Logo da Empresa</CardTitle>
                <CardDescription>
                  Faça upload do logo (máximo 2MB)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview do Logo */}
            <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/50">
              {formData.companyLogo ? (
                <img
                  src={formData.companyLogo}
                  alt="Logo da empresa"
                  className="max-h-32 max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum logo carregado</p>
                </div>
              )}
            </div>

            {/* Botões de Upload */}
            <div className="flex gap-2">
              <Label htmlFor="logoUpload" className="flex-1">
                <div className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Fazer Upload</span>
                </div>
                <Input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </Label>

              {formData.companyLogo && (
                <Button
                  variant="outline"
                  onClick={() => setFormData({ ...formData, companyLogo: '' })}
                >
                  Remover
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyLogoUrl">Ou cole a URL da imagem</Label>
              <Input
                id="companyLogoUrl"
                value={formData.companyLogo}
                onChange={(e) =>
                  setFormData({ ...formData, companyLogo: e.target.value })
                }
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tema */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <Settings className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Configure o tema visual do sistema
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Tema</p>
                <p className="text-sm text-muted-foreground">
                  Escolha entre claro, escuro ou sistema
                </p>
              </div>
              <ThemeToggle theme={theme} onThemeChange={setTheme} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Ação */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar Padrão
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesPage;
