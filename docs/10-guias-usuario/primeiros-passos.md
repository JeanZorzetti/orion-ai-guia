# Primeiros Passos - Orion ERP

> Guia inicial para começar a usar o Orion ERP

**Última atualização:** 04/11/2025
**Versão:** 2.0.0

---

## 📋 Índice

1. [Bem-vindo ao Orion ERP](#bem-vindo-ao-orion-erp)
2. [Primeiro Acesso](#primeiro-acesso)
3. [Entendendo a Interface](#entendendo-a-interface)
4. [Explorando o Dashboard](#explorando-o-dashboard)
5. [Navegando pelos Módulos](#navegando-pelos-módulos)
6. [Próximos Passos](#próximos-passos)

---

## 🎯 Bem-vindo ao Orion ERP

Parabéns por escolher o **Orion ERP** para gerenciar sua empresa!

Este guia vai te ajudar a:
- Fazer seu primeiro acesso
- Entender a interface do sistema
- Realizar configurações iniciais importantes
- Executar suas primeiras tarefas

**Tempo estimado:** 10-15 minutos

---

## 🔑 Primeiro Acesso

### 1. Acessar o Sistema

1. Abra seu navegador (Chrome, Firefox, Edge ou Safari)
2. Acesse a URL do Orion ERP:
   - **Produção**: https://orionerp.roilabs.com.br
   - **Desenvolvimento local**: http://localhost:3000

### 2. Tela de Login

Você verá a tela de login do Orion ERP com:
- Logo "Orion ERP" centralizado
- Campo de **Email**
- Campo de **Senha**
- Botão **Entrar**
- Link "Não tem uma conta? Criar conta"

### 3. Fazer Login

1. Digite seu **email** no primeiro campo
2. Digite sua **senha** no segundo campo
3. Clique no botão **Entrar**

**Criando uma conta:**
- Se você ainda não tem uma conta, clique em **"Criar conta"**
- Você será redirecionado para a página de registro (`/register`)
- Preencha os dados solicitados e crie sua conta

### 4. Após o Login

Após autenticação bem-sucedida:
- Você será redirecionado automaticamente para `/admin/dashboard`
- Suas informações de usuário são salvas localmente para manter a sessão
- O sistema carrega os dados do seu workspace (empresa)

---

## 🖥️ Entendendo a Interface

### Layout Principal

A interface do Orion ERP é dividida em três áreas principais:

```
┌─────────────────────────────────────────────────────────┐
│  [Logo] Orion ERP              🔔 Notificações  👤 User │ ← Header
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  MENU    │           CONTEÚDO PRINCIPAL                │
│ LATERAL  │                                              │
│          │  • Dashboard com métricas                    │
│  📊 Dash │  • Gráficos e visualizações                 │
│  💰 Fin. │  • Tabelas de dados                          │
│  📦 Esto.│  • Formulários e ações                       │
│  🛒 Vend.│                                              │
│  ⚙️ Conf.│                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 1. Header (Barra Superior)

Localizado no topo da tela, contém:

- **Logo Orion ERP**: Clique para voltar ao dashboard
- **Notificações** (🔔):
  - Exibe notificações em tempo real
  - Badge com contador de não lidas
  - Painel deslizante ao clicar
  - Tipos: Alertas, Avisos, Info, Sucesso
  - Prioridades: Baixa, Média, Alta, Urgente
- **Menu de Usuário** (👤):
  - Informações do usuário logado
  - Configurações
  - Botão de logout

### 2. Menu Lateral (Sidebar)

O menu lateral contém todos os módulos organizados hierarquicamente:

#### Menu Principal

| Ícone | Módulo | O que faz |
|-------|--------|-----------|
| 📊 | **Dashboard** | Visão geral com KPIs, gráficos e métricas principais |
| 💰 | **Financeiro** | Contas a pagar/receber, fluxo de caixa, relatórios |
| 📦 | **Vendas & Estoque** | Produtos, vendas, movimentações, inventário |

#### Menu Sistema

| Ícone | Item | O que faz |
|-------|------|-----------|
| ⚙️ | **Configurações** | Configurações fiscais e integrações |
| ❓ | **Ajuda** | Central de ajuda e documentação |

#### Funcionalidades do Menu

**Expansão de Submenus:**

- Itens com seta (>) possuem submenus
- Clique para expandir e ver as opções
- Submenus podem ter até 3 níveis de profundidade

**Colapsar/Expandir Sidebar:**

- Botão de toggle no canto superior direito do menu
- Modo colapsado: mostra apenas ícones
- Modo expandido: mostra ícones + textos

**Workspace Selector:**

- Localizado logo abaixo do header na sidebar
- Mostra o workspace (empresa) atual
- Badge indicando seu papel: Super Admin, Admin ou Membro
- Clique para trocar entre workspaces (se tiver acesso a mais de um)
- Opção "Criar novo workspace" no menu dropdown

**Footer do Menu:**

- **Toggle de Tema**: Alternar entre Claro/Escuro/Sistema
- **Super Admin** (apenas para super admins): Link para painel administrativo
- **Sair**: Botão vermelho para fazer logout

### 3. Área de Conteúdo

É a área principal onde você:

- Visualiza dashboards e gráficos
- Preenche formulários
- Gerencia registros (produtos, vendas, faturas)
- Gera relatórios
- Configura integrações

---

## 📊 Explorando o Dashboard

O Dashboard é a primeira tela que você vê após o login. Ele oferece uma visão completa do seu negócio.

### Filtros (Topo do Dashboard)

**Card de Filtros** - com fundo gradiente azul/roxo:

1. **Período**: Seletor de data range
   - Padrão: Últimos 30 dias
   - Clique para abrir calendário
   - Selecione data inicial e final

2. **Canais de Venda**: Multi-select de canais
   - Filtra dados por origem (manual, shopify, mercadolivre, etc.)
   - Selecione um ou vários canais

**Botão "Limpar filtros"**: Remove todos os filtros aplicados

### Cards de Métricas Principais

#### Card Principal (2 colunas)

**Receita Total (Mês)**

- Valor em destaque (ex: R$ 125.430,00)
- Número de vendas completadas
- **Sparkline**: Gráfico de linhas dos últimos 30 dias
- **Trend Badge**: Comparação com mês anterior
  - Verde (↑): Aumento
  - Vermelho (↓): Queda
  - Percentual de variação

#### Cards Secundários

**Vendas Totais**

- Número total de vendas completadas
- Sparkline de contagem de vendas
- Tendência vs. mês anterior

**Valor em Estoque**

- Total do valor de produtos em estoque (quantidade × preço)
- Mini gráfico de barras
- Número de produtos ativos

**Total a Pagar**

- Soma de faturas pendentes (cor laranja)
- Número de faturas pendentes
- Badge vermelho se houver vencidas

**Total Pago**

- Soma de faturas pagas (cor verde)
- Número de faturas pagas

**Ticket Médio**

- Valor médio por venda (receita total ÷ número de vendas)

**Produtos em Alerta**

- Produtos com estoque abaixo do mínimo (cor laranja)
- Badge "Ação necessária" se houver alertas

### Gráficos Avançados

**Receita nas Últimas 4 Semanas**

- Gráfico de barras/linhas
- Evolução semanal da receita
- Permite visualizar tendências

**Vendas por Canal (6 Meses)**

- Gráfico de linhas empilhadas ou barras
- Distribuição de receita por marketplace
- Identifica canais mais rentáveis

### AI Insights

**Card de Insights** (gerado automaticamente):

- Até 5 insights principais exibidos
- Análise inteligente dos dados
- Recomendações baseadas em padrões
- Alertas sobre situações importantes

### Cards de Ação Rápida

**Próximas a Vencer**

- Faturas que vencem nos próximos 7 dias
- Mostra fornecedor e valor
- Data de vencimento
- Link "Ver todas" para tela de contas a pagar

**Faturas Vencidas** (se houver)

- Card com fundo vermelho claro
- Lista faturas já vencidas
- Badge com quantidade
- Destacado para atenção imediata

**Atenção ao Estoque**

- Produtos com estoque baixo
- Mostra quantidade atual vs. mínimo
- Badge vermelho se zerado
- Link "Ver todos" para tela de produtos

**Vendas dos Últimos 7 Dias**

- Gráfico de barras horizontal
- Vendas por dia da semana
- Total e ticket médio ao final

---

## 🧭 Navegando pelos Módulos

### Módulo Dashboard

**Localização**: Menu Lateral > Dashboard

**O que tem:**

- Visão geral completa do negócio
- Filtros por período e canal
- Cards de métricas financeiras e operacionais
- Gráficos de receita e vendas
- Insights gerados por IA
- Alertas de faturas e estoque

**Quando usar:**

- Início do dia para ver status geral
- Antes de reuniões para ter dados atualizados
- Monitoramento de metas

### Módulo Financeiro

**Localização**: Menu Lateral > Financeiro

**Subm ódulos:**

1. **Dashboard Financeiro** (`/admin/financeiro`)
   - Visão geral financeira

2. **Contas a Pagar** (`/admin/financeiro/contas-a-pagar`)
   - **Dashboard**: Visão geral de contas a pagar
   - **Faturas**: Lista e gestão de faturas
   - **Aprovações**: Workflow de aprovação
   - **Fornecedores**: Cadastro de fornecedores
   - **Descontos**: Análise de descontos
   - **Conciliação**: Conciliação bancária
   - **Portal Fornecedor**: Portal para fornecedores

3. **Contas a Receber** (`/admin/financeiro/contas-a-receber`)
   - **Dashboard**: Visão geral de recebíveis
   - **Automação**: Automação de cobrança
   - **Análise de Risco**: Análise de clientes
   - **Meios de Pagamento**: Configuração de pagamentos

4. **Fluxo de Caixa** (`/admin/financeiro/fluxo-caixa`)
   - Projeções e movimentações
   - Análise de cenários
   - Simulador de impacto

5. **Relatórios** (`/admin/financeiro/relatorios`)
   - Relatórios financeiros diversos

6. **Fornecedores** (`/admin/fornecedores`)
   - Gestão completa de fornecedores

### Módulo Vendas & Estoque

**Localização**: Menu Lateral > Vendas & Estoque

**Submódulos:**

1. **Dashboard** (`/admin/estoque`)
   - Visão geral de estoque e vendas

2. **Vendas**
   - **Dashboard** (`/admin/vendas`)
   - **Funil** (`/admin/vendas/funil`): Pipeline de vendas
   - **Marketplace** (`/admin/vendas/marketplace`): Integrações
   - **Logística** (`/admin/vendas/logistica`): Picking, packing, expedição
   - **Analytics** (`/admin/vendas/analytics`): Análises de vendas

3. **Produtos** (`/admin/estoque/produtos`)
   - Cadastro e gestão de produtos
   - Variações e categorias

4. **Lotes e Validades** (`/admin/estoque/lotes`)
   - Controle de lotes
   - Rastreabilidade FIFO/FEFO

5. **Depósitos** (`/admin/estoque/depositos`)
   - Múltiplos armazéns
   - Transferências entre depósitos

6. **Automação e IA** (`/admin/estoque/automacao`)
   - Automações de estoque
   - Previsões baseadas em IA

7. **Movimentações** (`/admin/estoque/movimentacoes`)
   - Entradas, saídas e ajustes
   - Histórico completo

8. **Inventário** (`/admin/estoque/inventario`)
   - Contagem cíclica
   - Conciliação de divergências

9. **Relatórios** (`/admin/estoque/relatorios`)
   - Posição de estoque
   - Giro de estoque
   - Produtos em falta

### Módulo Configurações

**Localização**: Menu Lateral > Sistema > Configurações

**Submenus:**

1. **Configurações** (`/admin/configuracoes`)
   - Configurações gerais do sistema

2. **Configurações Fiscais** (`/admin/configuracoes/fiscal`)
   - Dados fiscais da empresa
   - Certificado digital
   - Integrações com PlugNotas/FocusNFe

3. **Integrações** (`/admin/integracoes`)
   - Shopify
   - Mercado Livre (com callback OAuth)
   - WooCommerce
   - Magazine Luiza
   - TikTok Shop (com callback OAuth)

### Módulo Ajuda

**Localização**: Menu Lateral > Sistema > Ajuda

**O que tem:**

- Central de ajuda
- Documentação
- Tutoriais
- FAQ

---

## 📖 Próximos Passos

Agora que você conhece a interface básica, explore:

### Para Gestores

1. **Configure seu Workspace**:
   - Verifique dados da empresa em Configurações
   - Configure integrações fiscais (se necessário)
   - Conecte marketplaces em Integrações

2. **Explore Métricas**:
   - Analise Dashboard diariamente
   - Configure filtros personalizados
   - Estude os Insights gerados por IA

3. **Configure Alertas**:
   - Notificações de estoque baixo
   - Alertas de faturas vencendo
   - Metas e KPIs

### Para Operadores

1. **Familiarize-se com Cadastros**:
   - Navegue por Produtos
   - Veja como funcionam as Movimentações
   - Explore o fluxo de Vendas

2. **Entenda os Processos**:
   - Fluxo de entrada de estoque
   - Processo de venda
   - Logística (picking/packing)

3. **Use Relatórios**:
   - Posição de estoque
   - Vendas do período
   - Movimentações

### Documentação Adicional

Consulte os guias específicos para se aprofundar:

- [Gestão Financeira](gestao-financeira.md) - Contas, fluxo de caixa, relatórios
- [Gestão de Estoque](gestao-estoque.md) - Produtos, movimentações, inventário
- [Gestão de Vendas](gestao-vendas.md) - Marketplace, funil, analytics

---

## 💡 Dicas Importantes

### Navegação

✅ **Breadcrumb**: Use o caminho no topo para navegar rapidamente

✅ **Voltar ao Dashboard**: Clique no logo "Orion ERP" no topo

### Interface

✅ **Tema Claro/Escuro**: Use o toggle no rodapé do menu

✅ **Colapsar Menu**: Ganhe mais espaço na tela

✅ **Workspace**: Troque entre empresas pelo seletor

### Dados

✅ **Filtros**: Todos os dashboards têm filtros de período/canal

✅ **Exportação**: Maioria dos relatórios pode ser exportada

✅ **Tempo Real**: Notificações são atualizadas automaticamente

### Segurança

✅ **Logout**: Sempre faça logout ao sair, especialmente em computadores compartilhados

✅ **Sessão**: Tokens JWT mantêm você logado com segurança

✅ **Permissões**: Cada usuário vê apenas o que tem permissão

---

## ❓ Perguntas Frequentes

### Como faço logout?

No rodapé do menu lateral, clique no botão vermelho **"Sair"** com ícone de logout.

### Como trocar de workspace?

1. Clique no Workspace Selector (logo abaixo do header na sidebar)
2. Selecione outro workspace da lista
3. A página será recarregada com os dados do novo workspace

### Onde vejo as notificações?

Clique no ícone de sino (🔔) no header. Um painel deslizante abrirá mostrando:

- Notificações não lidas no topo
- Opções de filtro por tipo/prioridade
- Botão "Marcar todas como lidas"
- Histórico completo

### Como personalizo o dashboard?

Atualmente, use os **filtros de Período e Canal** no topo do dashboard para focar nos dados que importam para você.

### Posso acessar de dispositivos móveis?

Sim! A interface é responsiva e funciona em tablets e smartphones. Use os mesmos navegadores recomendados.

---

## 📞 Precisa de Ajuda?

Se você tiver dúvidas:

1. **Ajuda Integrada**: Clique em **Ajuda** no menu lateral
2. **Documentação Completa**: Consulte os guias específicos de cada módulo
3. **Suporte Técnico**:
   - Email: suporte@roilabs.com.br
   - WhatsApp: (disponível em horário comercial)

---

**Bem-vindo ao Orion ERP! Explore à vontade e descubra como o sistema pode ajudar sua empresa a crescer.** 🚀

---

**Última atualização:** 04/11/2025 | **Versão:** 2.0.0
