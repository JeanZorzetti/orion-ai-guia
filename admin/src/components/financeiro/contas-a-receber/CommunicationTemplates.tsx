'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, MessageSquare, Smartphone, Save, Copy } from 'lucide-react';

interface Template {
  id: string;
  nome: string;
  tipo: 'lembrete_prevencimento' | 'cobranca_vencido' | 'acordo_pagamento' | 'alerta_valor_alto';
  canal: 'email' | 'whatsapp' | 'sms';
  assunto?: string;
  corpo: string;
  variaveis: string[];
}

// Templates mock
const mockTemplates: Record<string, Template[]> = {
  email: [
    {
      id: 'email-1',
      nome: 'Lembrete Pré-Vencimento',
      tipo: 'lembrete_prevencimento',
      canal: 'email',
      assunto: 'Lembrete: Título {documento} vence em {dias_vencimento} dias',
      corpo: `Olá {cliente_nome},

Este é um lembrete amigável sobre o título {documento} que vence em {dias_vencimento} dias.

Detalhes:
- Documento: {documento}
- Valor: {valor}
- Data de Vencimento: {vencimento}

Para facilitar o pagamento, disponibilizamos as seguintes opções:
- PIX
- Boleto Bancário
- Cartão de Crédito

Atenciosamente,
Equipe Financeira`,
      variaveis: ['{cliente_nome}', '{documento}', '{valor}', '{vencimento}', '{dias_vencimento}'],
    },
    {
      id: 'email-2',
      nome: 'Cobrança - Título Vencido',
      tipo: 'cobranca_vencido',
      canal: 'email',
      assunto: 'URGENTE: Título {documento} vencido há {dias_atraso} dias',
      corpo: `Prezado(a) {cliente_nome},

Identificamos que o título {documento} está vencido há {dias_atraso} dias.

Valor Original: {valor}
Data de Vencimento: {vencimento}
Multa: {multa}
Juros: {juros}
TOTAL ATUALIZADO: {valor_total}

Solicitamos a regularização urgente para evitar a suspensão de crédito.

Para pagamento, acesse o link abaixo ou entre em contato conosco.

Atenciosamente,
Departamento de Cobranças`,
      variaveis: ['{cliente_nome}', '{documento}', '{valor}', '{vencimento}', '{dias_atraso}', '{multa}', '{juros}', '{valor_total}'],
    },
  ],
  whatsapp: [
    {
      id: 'whatsapp-1',
      nome: 'Lembrete Pré-Vencimento',
      tipo: 'lembrete_prevencimento',
      canal: 'whatsapp',
      corpo: `Olá *{cliente_nome}*! 👋

Lembrete: Seu título *{documento}* vence em *{dias_vencimento} dias*.

💰 Valor: *{valor}*
📅 Vencimento: *{vencimento}*

Pague pelo PIX ou Boleto!

Dúvidas? Estamos à disposição! 😊`,
      variaveis: ['{cliente_nome}', '{documento}', '{valor}', '{vencimento}', '{dias_vencimento}'],
    },
    {
      id: 'whatsapp-2',
      nome: 'Cobrança - Título Vencido',
      tipo: 'cobranca_vencido',
      canal: 'whatsapp',
      corpo: `⚠️ *ATENÇÃO {cliente_nome}*

Título *{documento}* vencido há *{dias_atraso} dias*!

💵 Valor atualizado: *{valor_total}*
(Valor original + multa e juros)

📲 Pague agora pelo PIX e evite bloqueios!

Precisa negociar? Responda esta mensagem!`,
      variaveis: ['{cliente_nome}', '{documento}', '{dias_atraso}', '{valor_total}'],
    },
  ],
  sms: [
    {
      id: 'sms-1',
      nome: 'Lembrete Pré-Vencimento',
      tipo: 'lembrete_prevencimento',
      canal: 'sms',
      corpo: 'Lembrete: Titulo {documento} vence em {dias_vencimento} dias. Valor: {valor}. Pague pelo app ou site.',
      variaveis: ['{documento}', '{valor}', '{dias_vencimento}'],
    },
    {
      id: 'sms-2',
      nome: 'Cobrança - Título Vencido',
      tipo: 'cobranca_vencido',
      canal: 'sms',
      corpo: 'URGENTE: Titulo {documento} vencido ha {dias_atraso} dias. Valor: {valor_total}. Regularize agora!',
      variaveis: ['{documento}', '{dias_atraso}', '{valor_total}'],
    },
  ],
};

export const CommunicationTemplates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    mockTemplates.email[0]
  );
  const [editMode, setEditMode] = useState(false);

  const handleSaveTemplate = () => {
    // Aqui salvaria o template editado
    setEditMode(false);
  };

  const handleCopyTemplate = () => {
    if (selectedTemplate) {
      navigator.clipboard.writeText(selectedTemplate.corpo);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates de Comunicação</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'email' | 'whatsapp' | 'sms')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            {/* Seletor de template */}
            <div className="flex gap-2">
              {mockTemplates.email.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.nome}
                </Button>
              ))}
            </div>

            {selectedTemplate && selectedTemplate.canal === 'email' && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="assunto">Assunto do Email</Label>
                  <Input
                    id="assunto"
                    value={selectedTemplate.assunto}
                    readOnly={!editMode}
                    placeholder="Assunto do email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="corpo">Corpo do Email</Label>
                  <Textarea
                    id="corpo"
                    value={selectedTemplate.corpo}
                    readOnly={!editMode}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variaveis.map((variavel) => (
                      <Badge key={variavel} variant="outline" className="cursor-pointer">
                        {variavel}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique para copiar • As variáveis serão substituídas automaticamente
                  </p>
                </div>

                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button onClick={handleSaveTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditMode(true)}>
                        Editar Template
                      </Button>
                      <Button variant="outline" onClick={handleCopyTemplate}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            {/* Seletor de template */}
            <div className="flex gap-2">
              {mockTemplates.whatsapp.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.nome}
                </Button>
              ))}
            </div>

            {selectedTemplate && selectedTemplate.canal === 'whatsapp' && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="corpo-whatsapp">Mensagem WhatsApp</Label>
                  <Textarea
                    id="corpo-whatsapp"
                    value={selectedTemplate.corpo}
                    readOnly={!editMode}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use *texto* para negrito e _texto_ para itálico
                  </p>
                </div>

                <div>
                  <Label>Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variaveis.map((variavel) => (
                      <Badge key={variavel} variant="outline">
                        {variavel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button onClick={handleSaveTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditMode(true)}>
                        Editar Template
                      </Button>
                      <Button variant="outline" onClick={handleCopyTemplate}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sms" className="space-y-4 mt-4">
            {/* Seletor de template */}
            <div className="flex gap-2">
              {mockTemplates.sms.map((template) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.nome}
                </Button>
              ))}
            </div>

            {selectedTemplate && selectedTemplate.canal === 'sms' && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="corpo-sms">Mensagem SMS</Label>
                  <Textarea
                    id="corpo-sms"
                    value={selectedTemplate.corpo}
                    readOnly={!editMode}
                    rows={4}
                    className="font-mono text-sm"
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.corpo.length}/160 caracteres
                  </p>
                </div>

                <div>
                  <Label>Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate.variaveis.map((variavel) => (
                      <Badge key={variavel} variant="outline">
                        {variavel}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editMode ? (
                    <>
                      <Button onClick={handleSaveTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditMode(true)}>
                        Editar Template
                      </Button>
                      <Button variant="outline" onClick={handleCopyTemplate}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
