import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  ArrowRight
} from 'lucide-react';

const ConfiguracoesPage: React.FC = () => {
  const configuracoes = [
    {
      categoria: 'Perfil do Usuário',
      descricao: 'Gerencie suas informações pessoais e preferências',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      items: [
        { label: 'Nome completo', valor: 'João Silva' },
        { label: 'E-mail', valor: 'joao@empresa.com' },
        { label: 'Cargo', valor: 'Administrador' },
      ],
    },
    {
      categoria: 'Empresa',
      descricao: 'Dados cadastrais e informações da empresa',
      icon: Building2,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      items: [
        { label: 'Razão Social', valor: 'Empresa ABC Ltda' },
        { label: 'CNPJ', valor: '00.000.000/0001-00' },
        { label: 'Endereço', valor: 'Rua Exemplo, 123' },
      ],
    },
    {
      categoria: 'Notificações',
      descricao: 'Configure alertas e lembretes do sistema',
      icon: Bell,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      items: [
        { label: 'E-mail', valor: 'Ativado' },
        { label: 'Contas a vencer', valor: 'Ativado' },
        { label: 'Estoque baixo', valor: 'Ativado' },
      ],
    },
    {
      categoria: 'Segurança',
      descricao: 'Senha, autenticação e controles de acesso',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      items: [
        { label: 'Autenticação em 2 fatores', valor: 'Desativado' },
        { label: 'Última alteração de senha', valor: 'Há 45 dias' },
        { label: 'Sessões ativas', valor: '2 dispositivos' },
      ],
    },
    {
      categoria: 'Aparência',
      descricao: 'Personalize a interface do sistema',
      icon: Palette,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      items: [
        { label: 'Tema', valor: 'Claro' },
        { label: 'Idioma', valor: 'Português (BR)' },
        { label: 'Formato de data', valor: 'DD/MM/AAAA' },
      ],
    },
    {
      categoria: 'Integrações',
      descricao: 'Conecte com serviços e APIs externas',
      icon: Mail,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
      items: [
        { label: 'E-mail (SMTP)', valor: 'Não configurado' },
        { label: 'API externa', valor: 'Não configurado' },
        { label: 'Backup automático', valor: 'Desativado' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as preferências e configurações do sistema
          </p>
        </div>
      </div>

      {/* Categorias de Configuração */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configuracoes.map((config) => (
          <Card key={config.categoria} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${config.bgColor}`}>
                  <config.icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{config.categoria}</CardTitle>
                  <CardDescription className="text-sm">
                    {config.descricao}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.valor}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">
                Editar {config.categoria}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Avançadas */}
      <Card className="border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-orange-500" />
            <CardTitle>Configurações Avançadas</CardTitle>
          </div>
          <CardDescription>
            Opções de gerenciamento de dados e manutenção do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="w-full">
              Exportar Dados
            </Button>
            <Button variant="outline" className="w-full">
              Importar Dados
            </Button>
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
              Limpar Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfiguracoesPage;
