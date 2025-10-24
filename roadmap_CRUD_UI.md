# Roadmap - CRUD UI Completo

**Objetivo:** Implementar todas as interfaces de usuário para operações CRUD (Create, Read, Update, Delete) nos módulos principais do Orion ERP.

**Status Atual:** ✅ Backend CRUD completo | 🔄 Frontend apenas com listagens

---

## Fase 5: UI CRUD Completa - Módulo Financeiro

### 5.1 - Contas a Pagar (Faturas) ✅

**Arquivo:** `admin/src/pages/ContasAPagar.tsx`

**Status Atual:**
- ✅ Listagem de faturas (GET)
- ✅ Filtros por status
- ✅ Delete com confirmação usando ConfirmDialog
- ✅ Criar nova fatura
- ✅ Editar fatura existente
- ✅ Visualizar detalhes completos

**Tarefas:**

1. **Modal de Criação de Fatura** ⭐ ✅
   * [x] Criar componente `CreateInvoiceModal.tsx`
   * [x] Formulário com validação:
     - Fornecedor (select/autocomplete)
     - Número da fatura
     - Data de emissão
     - Data de vencimento
     - Valor total, valor líquido, impostos
     - Status (pendente, validado, pago, cancelado)
     - Categoria
     - Observações
   * [x] Integração com `invoiceService.create()`
   * [x] Feedback visual (toast de sucesso/erro)
   * [x] Recarregar lista após criação

2. **Modal de Edição de Fatura** ⭐ ✅
   * [x] Criar componente `EditInvoiceModal.tsx`
   * [x] Pré-popular formulário com dados existentes
   * [x] Integração com `invoiceService.update(id, data)`
   * [x] Permitir mudança de status (workflow)
   * [x] Validações de campos
   * [x] Atualizar lista após edição

3. **Modal de Visualização/Detalhes** ⭐ ✅
   * [x] Criar componente `InvoiceDetailsModal.tsx`
   * [x] Exibir todos os campos da fatura
   * [x] Mostrar informações do fornecedor
   * [x] Botões: Editar, Deletar, Fechar

4. **Melhorias na Listagem** ⭐⭐ ✅
   * [x] Busca por número de fatura (em tempo real)
   * [x] Filtro por fornecedor (select com lista)
   * [x] Filtro por intervalo de datas (início e fim)
   * [x] Ordenação por colunas (5 campos clicáveis)
   * [x] Exportar para CSV/Excel com dados filtrados
   * [x] Contador de resultados filtrados
   * [x] Botão "Limpar Filtros"
   * [x] Indicadores visuais de ordenação (setas)
   * [ ] Paginação (skip/limit) - Opcional para depois

**Componentes UI Necessários:**
- `Button`, `Input`, `Select`, `DatePicker`
- `Dialog/Modal`, `Form`, `Label`
- `Card`, `Badge`, `Table`
- `Toast/Notification`

---

## Fase 6: UI CRUD Completa - Módulo Estoque

### 6.1 - Produtos ✅

**Arquivo:** `admin/src/app/admin/estoque/produtos/page.tsx`

**Status Atual:**
- ✅ Listagem de produtos (GET)
- ✅ Estatísticas dinâmicas
- ✅ Filtro de estoque baixo
- ✅ Busca por nome/SKU
- ✅ Delete com confirmação usando ConfirmDialog
- ✅ Criar novo produto
- ✅ Editar produto existente
- ✅ Visualizar detalhes completos
- ✅ Ajustar estoque com auditoria

**Tarefas:**

1. **Modal de Criação de Produto** ⭐ ✅
   * [x] Criar componente `CreateProductModal.tsx`
   * [x] Formulário com validação:
     - Nome do produto
     - SKU (único por workspace)
     - Descrição
     - Categoria
     - Preço de custo
     - Preço de venda
     - Quantidade em estoque
     - Nível mínimo de estoque
     - Unidade de medida
     - Status (ativo/inativo)
   * [x] Integração com `productService.create()`
   * [x] Cálculo automático de margem de lucro em tempo real
   * [x] Feedback visual (toast)

2. **Modal de Edição de Produto** ⭐ ✅
   * [x] Criar componente `EditProductModal.tsx`
   * [x] Pré-popular todos os campos
   * [x] Integração com `productService.update(id, data)`
   * [x] Alerta se estoque for alterado manualmente
   * [x] Desabilitar edição de SKU
   * [x] Atualizar estatísticas após edição

3. **Modal de Detalhes do Produto** ⭐ ✅
   * [x] Criar componente `ProductDetailsModal.tsx`
   * [x] Exibir todas as informações formatadas
   * [x] Cards organizados (Estoque, Preços, Sistema)
   * [x] Badges de status (Ativo, Estoque)
   * [x] Cálculos: margem, lucro, valor total
   * [x] Botões: Editar, Deletar, Ajustar Estoque

4. **Ajuste de Estoque** ⭐⭐ ✅
   * [x] Criar componente `AdjustStockModal.tsx`
   * [x] Tipos de ajuste:
     - Entrada manual (adicionar)
     - Saída manual (remover)
     - Correção de inventário (definir valor exato)
   * [x] Registrar motivo do ajuste (obrigatório)
   * [x] Atualizar `stock_quantity` do produto
   * [x] Preview em tempo real do resultado

5. **Melhorias na Listagem** ⭐⭐ ✅ COMPLETO
   * [x] Filtro por categoria (dinâmico)
   * [x] Filtro por status (ativo/inativo com ícones)
   * [x] Filtro por nível de estoque (crítico, baixo, OK)
   * [x] Ordenação por: nome, categoria, estoque, preço
   * [x] Indicadores visuais com cores (🔴 🟠 🟢)
   * [x] Busca em tempo real
   * [x] Botão "Limpar Filtros"
   * [x] Contador de resultados
   * [x] Exportação CSV filtrada
   * [x] Paginação (10/25/50/100 itens + navegação)
   * [x] Visualização em cards/grid (toggle com tabela)

---

## Fase 7: UI CRUD Completa - Módulo Vendas

### 7.1 - Vendas ✅

**Arquivo:** `admin/src/app/admin/vendas/page.tsx`

**Status Atual:**

- ✅ Listagem de vendas (GET)
- ✅ Estatísticas dinâmicas (Total Vendas, Completas, Receita, Ticket Médio)
- ✅ Filtros por status
- ✅ Busca por nome do cliente
- ✅ Delete com confirmação usando ConfirmDialog
- ✅ Criar nova venda
- ✅ Editar venda existente
- ✅ Visualizar detalhes completos

**Tarefas:**

1. **Criar Página de Vendas** ⭐ ✅
   * [x] Estrutura base da página
   * [x] Listagem de vendas com `saleService.getAll()`
   * [x] Colunas: Data, Cliente, Produto, Qtd, Valor Unit., Total, Status
   * [x] Filtros: status
   * [x] Busca por nome do cliente (frontend)
   * [x] Estatísticas: total vendas, ticket médio, receita

2. **Modal de Criação de Venda** ⭐⭐ ✅
   * [x] Criar componente `CreateSaleModal.tsx`
   * [x] Formulário com:
     - Produto (select com busca)
     - Cliente (nome)
     - Quantidade
     - Preço unitário (pré-preenchido do produto)
     - Total (calculado automaticamente)
     - Data da venda
     - Observações
   * [x] Validação: estoque disponível
   * [x] Integração com `saleService.create()`
   * [x] Atualização automática de estoque no backend
   * [x] Alerta se estoque insuficiente

3. **Modal de Edição de Venda** ⭐⭐ ✅
   * [x] Criar componente `EditSaleModal.tsx`
   * [x] Permitir editar: quantidade, preço, cliente, observações
   * [x] Recalcular total automaticamente
   * [x] Status: pendente, completo, cancelado
   * [x] Validações de negócio

4. **Modal de Detalhes da Venda** ✅
   * [x] Criar componente `SaleDetailsModal.tsx`
   * [x] Informações completas da venda
   * [x] Dados do produto vendido
   * [x] Cards organizados (Cliente, Produto, Valores, Data, Sistema)
   * [x] Badges de status

5. **Cancelamento de Venda** ⭐ ✅
   * [x] Botão "Deletar" com confirmação
   * [x] Confirmação com ConfirmDialog
   * [x] Integração com saleService.delete()

---

## Fase 8: UI CRUD Completa - Módulo Fornecedores

### 8.1 - Fornecedores ✅

**Arquivo:** `admin/src/app/admin/fornecedores/page.tsx`

**Status Atual:**

- ✅ Listagem de fornecedores (GET)
- ✅ Estatísticas dinâmicas (Total, Ativos, Inativos)
- ✅ Filtros por status (Todos, Ativos, Inativos)
- ✅ Busca por nome, documento ou email
- ✅ Delete com confirmação usando ConfirmDialog
- ✅ Criar novo fornecedor
- ✅ Editar fornecedor existente
- ✅ Visualizar detalhes completos
- ✅ Link adicionado no menu lateral (seção Financeiro)

**Tarefas:**

1. **Criar Página de Fornecedores** ⭐ ✅
   * [x] Estrutura base da página
   * [x] Listagem com `supplierService.getAll()`
   * [x] Colunas: Nome, Documento (CNPJ/CPF), Email, Telefone, Cidade/UF, Status
   * [x] Filtros: ativo/inativo
   * [x] Busca por nome, documento ou email
   * [x] Estatísticas: total fornecedores, ativos, inativos
   * [x] Formatação de CPF/CNPJ

2. **Modal de Criação de Fornecedor** ⭐ ✅
   * [x] Criar componente `CreateSupplierModal.tsx`
   * [x] Formulário com:
     - Nome completo
     - Documento (CNPJ/CPF)
     - Email
     - Telefone
     - Endereço completo (Rua, Cidade, Estado, CEP)
     - Status ativo por padrão
   * [x] Validação de email e documento (CPF 11 dígitos, CNPJ 14 dígitos)
   * [x] Integração com `supplierService.create()`

3. **Modal de Edição de Fornecedor** ⭐ ✅
   * [x] Criar componente `EditSupplierModal.tsx`
   * [x] Pré-popular todos os campos
   * [x] Switch para ativar/desativar fornecedor
   * [x] Integração com `supplierService.update()`
   * [x] Validações com React Hook Form + Zod

4. **Modal de Detalhes do Fornecedor** ✅
   * [x] Criar componente `SupplierDetailsModal.tsx`
   * [x] Todas as informações do fornecedor formatadas
   * [x] Cards organizados (Contato, Endereço, Sistema)
   * [x] Badges de status (Ativo/Inativo)
   * [x] Botões: Editar, Excluir, Fechar

---

## Fase 9: Dashboard Completo

### 9.1 - Dashboard Admin ✅

**Arquivo:** `admin/src/app/admin/dashboard/page.tsx`

**Status Atual:**

- ✅ Dados reais da API (invoices, products, sales)
- ✅ Client component com loading state
- ✅ Carregamento paralelo de dados
- ✅ Estatísticas financeiras calculadas
- ✅ Estatísticas de estoque calculadas
- ✅ Estatísticas de vendas calculadas
- ✅ Gráfico de vendas dos últimos 7 dias

**Tarefas:**

1. **Estatísticas Financeiras** ⭐ ✅
   * [x] Card: Total a Pagar (faturas pendentes)
   * [x] Card: Total Pago (faturas pagas)
   * [x] Card: Faturas Vencidas (com destaque vermelho)
   * [x] Card: Próximas a Vencer (próximos 7 dias)
   * [x] Integração com invoiceService.getAll()
   * [x] Cálculos em tempo real
   * [x] Formatação de moeda e datas

2. **Estatísticas de Estoque** ⭐ ✅
   * [x] Card: Valor Total em Estoque
   * [x] Card: Produtos Ativos
   * [x] Lista: Produtos com Estoque Baixo (<= mínimo)
   * [x] Badge diferenciado para estoque zero (crítico)
   * [x] Alerta visual para produtos críticos
   * [x] Apenas produtos ativos considerados
   * [x] Empty state quando estoque está adequado

3. **Estatísticas de Vendas** ⭐ ✅
   * [x] Card: Receita de Vendas (vendas completadas)
   * [x] Card: Ticket Médio (calculado dinamicamente)
   * [x] Gráfico: Vendas dos últimos 7 dias
   * [x] Barra de progresso proporcional por dia
   * [x] Total e ticket médio no rodapé do gráfico
   * [x] Integração com saleService.getAll()

4. **Melhorias Gerais** ✅
   * [x] Loading state com spinner animado
   * [x] Empty states user-friendly
   * [x] Links para páginas de detalhes
   * [x] 4 cards de métricas principais no topo
   * [x] Verificações de segurança (campos opcionais)

---

## Fase 10: Melhorias de UX/UI ✅ (COMPLETA)

**Status Geral:**

- ✅ 10.1 - Componentes Reutilizáveis - **COMPLETO**
  - ✅ DataTable genérico (completo)
  - ✅ FormModal genérico (completo)
  - ✅ ConfirmDialog e useConfirm (completo)
  - ✅ Sistema de notificações Sonner (completo)
- ✅ 10.2 - Validações e Feedback - **COMPLETO**
  - ✅ Loading States (TableSkeleton, GridSkeleton, ButtonWithLoading)
  - ✅ Empty States (EmptyState component com ícones e ações)
  - ✅ Error Handling (ErrorBoundary global com retry)
  - ✅ Validação de Formulários (schemas Zod criados)

**Componentes Criados:**

- `DataTable` - Tabela genérica com paginação, ordenação, busca e filtros
- `FormModal` - Modal genérico para formulários com validação
- `TableSkeleton` - Skeleton para tabelas
- `GridSkeleton` - Skeleton para grids de cards
- `ButtonWithLoading` - Botão com spinner integrado
- `EmptyState` - Estados vazios com ícones, descrição e ações
- `ErrorBoundary` - Boundary de erro global

**Páginas Atualizadas:**

- ✅ Produtos (admin/src/app/admin/estoque/produtos/page.tsx)
- ✅ Faturas (admin/src/pages/ContasAPagar.tsx)
- ✅ Vendas (admin/src/app/admin/vendas/page.tsx)
- ✅ Fornecedores (admin/src/app/admin/fornecedores/page.tsx)

---

### 10.1 - Componentes Reutilizáveis

**Tarefas:**

1. **Componente de Tabela Genérico** ⭐⭐ ✅
   * [x] Criar `<DataTable>` com:
     - Paginação integrada (10/25/50/100 items)
     - Ordenação por colunas (asc/desc)
     - Filtros por coluna específica
     - Busca global configurável
     - Ações por linha (editar, deletar, visualizar)
     - Loading state (TableSkeleton)
     - Empty state (EmptyState com ícone e ação)
     - Error state com retry
   * [x] TypeScript genérico para type safety
   * [x] Estilização consistente
   * [x] Arquivo de exemplos de uso (data-table.example.tsx.md)

2. **Componente de Modal Genérico** ⭐ ✅
   * [x] Criar `<FormModal>` com:
     - Header customizável (título e descrição)
     - Body com children flexível
     - Footer com botões (Cancelar, Salvar)
     - Loading state (ButtonWithLoading)
     - Suporte a validação de formulário
     - Keyboard shortcuts (ESC para fechar, Ctrl+Enter para submeter)
     - Tamanhos configuráveis (sm, md, lg, xl, full)
     - Prevent close configurável
   * [x] Variante FormModalWithoutForm para casos complexos
   * [x] Arquivo de exemplos de uso (form-modal.example.tsx.md)

3. **Componente de Confirmação** ⭐ ✅
   * [x] Criar `<ConfirmDialog>` com:
     - Título e mensagem customizáveis
     - Tipo: info, warning, danger
     - Callbacks: onConfirm, onCancel
     - Loading durante ação
     - Animações
   * [x] Criar hook `useConfirm` para uso simplificado

4. **Sistema de Notificações** ⭐ ✅
   * [x] Sistema de toast já existe (Sonner)
     - Tipos: success, error, warning, info
     - Duração configurável
     - Empilhamento
     - Animações de entrada/saída

### 10.2 - Validações e Feedback

**Tarefas:**

1. **Validação de Formulários** ⭐⭐ ✅
   * [x] Instalar React Hook Form + Zod
   * [x] Criar schemas de validação para:
     - Invoice (invoice.ts)
     - Product (product.ts + schema de ajuste de estoque)
     - Sale (sale.ts com validação de total)
     - Supplier (supplier.ts com validação CPF/CNPJ)
   * [x] Mensagens de erro customizadas PT-BR
   * [x] Schemas com validações de negócio
   * [x] Implementar uso em formulários:
     - ✅ CreateProductModal, EditProductModal, AdjustStockModal
     - ✅ CreateInvoiceModal, EditInvoiceModal
     - ✅ CreateSaleModal, EditSaleModal
     - ✅ CreateSupplierModal, EditSupplierModal
   * [x] Documentação completa (lib/validations/README.md)

2. **Loading States** ⭐ ✅
   * [x] Skeletons para tabelas (TableSkeleton e GridSkeleton)
   * [x] Spinners para botões (ButtonWithLoading)
   * [ ] Overlay para modals
   * [x] Feedback visual em todas as ações assíncronas

3. **Empty States** ⭐ ✅
   * [x] Mensagens amigáveis quando não há dados
   * [x] Ilustrações ou ícones (EmptyState component)
   * [x] Call-to-action (ex: "Criar primeira fatura")

4. **Error Handling** ⭐⭐ ✅
   * [x] Boundary de erro global (ErrorBoundary)
   * [x] Mensagens de erro user-friendly
   * [x] Retry automático em falhas de rede (botão "Tentar Novamente")
   * [ ] Log de erros (opcional)

---

## Fase 11: Recursos Avançados

### 11.1 - Busca e Filtros Avançados

**Tarefas:**

1. **Busca Global** ⭐⭐ ✅
   * [x] Barra de busca no header
   * [x] Buscar em: faturas, produtos, vendas, fornecedores
   * [x] Resultados agrupados por tipo (com badges)
   * [x] Navegação rápida para resultado
   * [x] Keyboard shortcut (Ctrl+K ou Cmd+K)
   * [x] Debounce de busca (300ms)
   * [x] Loading state
   * [x] Empty states

2. **Filtros Persistentes** ⭐ ✅
   * [x] Salvar filtros no localStorage (usePersistedFilters hook)
   * [x] Restaurar filtros ao voltar à página (automático)
   * [x] Preset de filtros comuns (FilterPresets component)
   * [x] Limpar todos os filtros (clearFilters função)
   * [x] Implementado na página de Produtos com 4 presets:
     - ✅ Ativos
     - ⚠️ Estoque Baixo
     - 🚨 Estoque Crítico
     - ❌ Inativos

### 11.2 - Exportação de Dados

**Tarefas:**

1. **Exportar para CSV/Excel** ⭐ ✅ COMPLETO
   * [x] Botão "Exportar CSV" em listagens
   * [x] Função genérica exportToCSV em lib/export.ts
   * [x] Exportar dados filtrados (não apenas todos)
   * [x] Nome de arquivo com timestamp
   * [x] Formatação adequada (escape de vírgulas, aspas)
   * [x] BOM UTF-8 para compatibilidade com Excel
   * [x] Helpers de formatação (moeda, data, datetime)
   * [x] Implementado em todas as páginas principais:
     - Fornecedores (11 colunas)
     - Produtos (11 colunas com filtros)
     - Vendas (8 colunas com status traduzido)
     - Faturas (11 colunas com valores e impostos)

2. **Imprimir Relatórios** ⭐ ✅ COMPLETO
   * [x] CSS para impressão (print.css com @media print)
   * [x] Hook usePrint para gerenciar impressão
   * [x] Componente PrintButton com loading e tooltip
   * [x] Componente PrintLayout com cabeçalho e rodapé
   * [x] Componentes auxiliares (PrintOnly, NoPrint, PrintInfoGrid, PrintSummary)
   * [x] Integrado na página de Produtos
   * [x] Logo e cabeçalho da empresa automático
   * [ ] Integrar nas páginas de Faturas, Vendas e Fornecedores (próxima iteração)

### 11.3 - Temas e Personalização

**Tarefas:**

1. **Dark Mode** ⭐ ✅ COMPLETO
   * [x] Toggle dark/light mode (ThemeToggle component)
   * [x] Persistir preferência (localStorage)
   * [x] Suporte a tema System (detecta preferência do OS)
   * [x] Hook useTheme para gerenciar tema
   * [x] CSS global com variáveis dark mode
   * [x] Header atualizado com classes responsivas
   * [x] Dropdown com 3 opções: Claro, Escuro, Sistema
   * [x] Ícones: Sun (claro), Moon (escuro), Monitor (sistema)
   * [x] Transições suaves entre temas
   * [x] Testar contraste e acessibilidade

2. **Personalização** (Bonus)
   * [ ] Logo da empresa customizável
   * [ ] Cores do tema personalizadas
   * [ ] Nome da empresa no header editável

---

## Ordem de Implementação Sugerida

### Sprint 1 - Fundação (1-2 semanas) ✅ COMPLETO
1. ✅ Componentes reutilizáveis (ConfirmDialog + useConfirm hook)
2. ✅ Sistema de validação (React Hook Form + Zod instalados)
3. ✅ Schemas de validação criados (Invoice, Product, Sale, Supplier)
4. ✅ Sistema de notificações (toast - Sonner já existente)

### Sprint 2 - Módulo Financeiro (1 semana) ✅ COMPLETO
1. ✅ CRUD Completo de Faturas
   - [x] CreateInvoiceModal.tsx
   - [x] EditInvoiceModal.tsx
   - [x] InvoiceDetailsModal.tsx
   - [x] Integração na página ContasAPagar
   - [x] Validação com React Hook Form + Zod
   - [x] Auto-cálculo de valores
   - [x] Confirmação de exclusão com ConfirmDialog
2. ⏸ Melhorias na listagem (paginação, filtros avançados) - Opcional para depois

### Sprint 3 - Módulo Estoque (1 semana) ✅ COMPLETO
1. ✅ CRUD Completo de Produtos
   - [x] CreateProductModal.tsx
   - [x] EditProductModal.tsx
   - [x] ProductDetailsModal.tsx
   - [x] Integração na página Produtos
   - [x] Validação com React Hook Form + Zod
   - [x] Auto-cálculo de margem de lucro
   - [x] Confirmação de exclusão com ConfirmDialog
2. ✅ Ajuste de Estoque
   - [x] AdjustStockModal.tsx
   - [x] 3 tipos: Entrada, Saída, Correção
   - [x] Registro de motivo (auditoria)
   - [x] Preview do resultado em tempo real
3. ⏸ Melhorias na listagem (paginação, filtros) - Opcional para depois

### Sprint 4 - Módulo Vendas (1 semana)
1. ✅ Criar página de Vendas
2. ✅ CRUD Completo de Vendas
3. ✅ Validação de estoque

### Sprint 5 - Módulo Fornecedores (3-4 dias) ✅ COMPLETO

1. ✅ Criar página de Fornecedores
2. ✅ CRUD Completo de Fornecedores
3. ✅ Validação de CPF/CNPJ
4. ✅ Link no menu lateral

### Sprint 6 - Dashboard (3-4 dias) ✅ COMPLETO

1. ✅ Integração com API real
2. ✅ Estatísticas dinâmicas (Financeiro, Estoque, Vendas)
3. ✅ Gráfico de vendas dos últimos 7 dias
4. ✅ Loading states e empty states
5. ✅ 4 cards de métricas principais

### Sprint 7 - Polimento (3-4 dias) ✅ COMPLETO

1. ✅ Exportação para CSV
   - [x] Biblioteca genérica exportToCSV em lib/export.ts
   - [x] Implementada em Fornecedores
   - [x] Implementada em Produtos
   - [x] Implementada em Vendas
   - [x] Implementada em Faturas (Contas a Pagar)
   - [x] Formatação brasileira (moeda, data)
   - [x] UTF-8 BOM para Excel
   - [x] Timestamp nos arquivos
2. ✅ Busca global com Ctrl+K
   - [x] GlobalSearch component criado
   - [x] Busca em 4 entidades
   - [x] Keyboard shortcut (Ctrl+K / Cmd+K)
   - [x] Debounce 300ms
   - [x] Loading e empty states
3. ⏸ Dark mode (opcional - implementação futura)
4. ⏸ Testes e ajustes finais (opcional - próxima fase)

---

## Tecnologias Recomendadas

### Bibliotecas UI
- ✅ **shadcn/ui** - Componentes base (já usando)
- ✅ **Tailwind CSS** - Estilização (já usando)
- 📦 **React Hook Form** - Gerenciamento de formulários
- 📦 **Zod** - Validação de schemas
- 📦 **date-fns** - Manipulação de datas
- 📦 **react-hot-toast** ou **sonner** - Notificações (já tem sonner)

### Bibliotecas de Dados
- 📦 **TanStack Table** - Tabelas avançadas (paginação, ordenação)
- 📦 **recharts** ou **chart.js** - Gráficos
- 📦 **xlsx** - Exportação para Excel
- 📦 **react-input-mask** - Máscaras de input (CNPJ, telefone)

### Utilidades
- 📦 **clsx** ou **classnames** - Manipulação de classes CSS
- 📦 **react-icons** - Ícones adicionais (já tem lucide-react)

---

## Checklist de Qualidade

Antes de considerar cada módulo completo, verificar:

- [ ] **Funcionalidade**
  - [ ] CRUD completo funcionando
  - [ ] Validações implementadas
  - [ ] Error handling adequado
  - [ ] Loading states em todas as ações

- [ ] **UX/UI**
  - [ ] Design consistente
  - [ ] Responsivo (mobile-friendly)
  - [ ] Feedback visual claro
  - [ ] Mensagens user-friendly

- [ ] **Performance**
  - [ ] Paginação implementada
  - [ ] Sem recarregamentos desnecessários
  - [ ] Otimização de re-renders

- [ ] **Código**
  - [ ] TypeScript sem erros
  - [ ] Componentes reutilizáveis
  - [ ] Código limpo e documentado
  - [ ] Sem console.logs de debug

---

## Métricas de Sucesso

Ao final do roadmap CRUD UI, você terá:

- ✅ **100% dos CRUDs** implementados na UI
- ✅ **4 módulos completos**: Financeiro, Estoque, Vendas, Fornecedores
- ✅ **Dashboard funcional** com dados reais
- ✅ **UX profissional** com validações e feedback
- ✅ **Sistema pronto para usuários finais** testarem

---

**Última atualização:** 2025-10-23
**Versão:** 1.0
