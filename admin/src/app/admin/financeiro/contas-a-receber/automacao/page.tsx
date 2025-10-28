import React from 'react';
import { Settings } from 'lucide-react';
import { AutomatedReminders } from '@/components/financeiro/contas-a-receber/AutomatedReminders';
import { CommunicationTemplates } from '@/components/financeiro/contas-a-receber/CommunicationTemplates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AutomacaoCobrancasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-500" />
            Automação de Cobranças
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure regras automáticas e templates de comunicação
          </p>
        </div>
      </div>

      <Tabs defaultValue="regras" className="space-y-6">
        <TabsList>
          <TabsTrigger value="regras">Regras de Automação</TabsTrigger>
          <TabsTrigger value="templates">Templates de Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="regras" className="space-y-6">
          <AutomatedReminders />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <CommunicationTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
