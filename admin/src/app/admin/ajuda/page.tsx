import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle,
  BookOpen,
  Video,
  MessageCircle,
  FileQuestion,
  Search,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';

const AjudaPage: React.FC = () => {
  const perguntasFrequentes = [
    {
      pergunta: 'Como importar faturas?',
      resposta: 'Acesse o Dashboard e clique em "Importar Fatura". Faça upload do arquivo PDF ou XML.',
      categoria: 'Financeiro',
    },
    {
      pergunta: 'Como cadastrar novos produtos?',
      resposta: 'Vá em Estoque > Produtos e clique em "Novo Produto". Preencha as informações e salve.',
      categoria: 'Estoque',
    },
    {
      pergunta: 'Como gerar relatórios?',
      resposta: 'Cada módulo possui sua seção de relatórios. Selecione o período e os filtros desejados.',
      categoria: 'Geral',
    },
    {
      pergunta: 'Como alterar minha senha?',
      resposta: 'Acesse Configurações > Segurança e clique em "Alterar Senha".',
      categoria: 'Conta',
    },
  ];

  const recursos = [
    {
      titulo: 'Documentação',
      descricao: 'Guias completos sobre todos os recursos do sistema',
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      action: 'Acessar Docs',
    },
    {
      titulo: 'Tutoriais em Vídeo',
      descricao: 'Aprenda visualmente com nossos vídeos explicativos',
      icon: Video,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      action: 'Ver Vídeos',
    },
    {
      titulo: 'Chat de Suporte',
      descricao: 'Converse em tempo real com nossa equipe',
      icon: MessageCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      action: 'Iniciar Chat',
    },
    {
      titulo: 'Base de Conhecimento',
      descricao: 'Artigos e soluções para problemas comuns',
      icon: FileQuestion,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      action: 'Explorar',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-8 w-8" />
            Central de Ajuda
          </h1>
          <p className="text-muted-foreground mt-1">
            Encontre respostas e aprenda a usar o sistema
          </p>
        </div>
      </div>

      {/* Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pesquisar por dúvidas, tutoriais..."
                className="pl-10"
              />
            </div>
            <Button>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Recursos de Ajuda */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recursos de Aprendizado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recursos.map((recurso) => (
            <Card key={recurso.titulo} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`p-3 rounded-lg ${recurso.bgColor} w-fit mb-2`}>
                  <recurso.icon className={`h-6 w-6 ${recurso.color}`} />
                </div>
                <CardTitle className="text-base">{recurso.titulo}</CardTitle>
                <CardDescription className="text-sm">
                  {recurso.descricao}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {recurso.action}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Perguntas Frequentes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Perguntas Frequentes</h2>
        <div className="space-y-3">
          {perguntasFrequentes.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold mb-1">
                      {faq.pergunta}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{faq.resposta}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {faq.categoria}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Contato */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle>Ainda precisa de ajuda?</CardTitle>
          <CardDescription>
            Entre em contato com nossa equipe de suporte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="mr-2 h-4 w-4" />
              suporte@orionerp.com.br
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="mr-2 h-4 w-4" />
              (11) 9999-9999
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Horário de atendimento: Segunda a Sexta, das 9h às 18h
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AjudaPage;
