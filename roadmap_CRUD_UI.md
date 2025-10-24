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

4. **Melhorias na Listagem**
   * [ ] Adicionar paginação (skip/limit)
   * [ ] Busca por número de fatura
   * [ ] Filtro por fornecedor
   * [ ] Filtro por intervalo de datas
   * [ ] Ordenação por colunas
   * [ ] Exportar para CSV/Excel (bonus)

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

5. **Melhorias na Listagem**
   * [ ] Paginação
   * [ ] Filtro por categoria
   * [ ] Filtro por status (ativo/inativo)
   * [ ] Ordenação por: nome, estoque, preço
   * [ ] Visualização em cards/grid (além de tabela)
   * [ ] Indicadores visuais: estoque crítico, baixo, OK

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

### 8.1 - Fornecedores 📋 (NOVA PÁGINA)

**Arquivo:** `admin/src/app/admin/fornecedores/page.tsx` (CRIAR)

**Tarefas:**

1. **Criar Página de Fornecedores** ⭐
   * [ ] Estrutura base da página
   * [ ] Listagem com `supplierService.getAll()`
   * [ ] Colunas: Nome, Documento (CNPJ/CPF), Email, Telefone, Status
   * [ ] Filtros: ativo/inativo
   * [ ] Busca por nome ou documento
   * [ ] Estatísticas: total fornecedores, ativos, inativos

2. **Modal de Criação de Fornecedor** ⭐
   * [ ] Criar componente `CreateSupplierModal.tsx`
   * [ ] Formulário com:
     - Nome completo
     - Documento (CNPJ/CPF) com máscara
     - Email
     - Telefone com máscara
     - Endereço completo
     - Observações
     - Status (ativo)
   * [ ] Validação de email e documento
   * [ ] Integração com `supplierService.create()`

3. **Modal de Edição de Fornecedor** ⭐
   * [ ] Criar componente `EditSupplierModal.tsx`
   * [ ] Pré-popular todos os campos
   * [ ] Permitir ativar/desativar fornecedor
   * [ ] Integração com `supplierService.update()`
   * [ ] Validações

4. **Modal de Detalhes do Fornecedor**
   * [ ] Criar componente `SupplierDetailsModal.tsx`
   * [ ] Todas as informações do fornecedor
   * [ ] Listar faturas relacionadas
   * [ ] Histórico de compras (bonus)
   * [ ] Estatísticas: total gasto, número de faturas

---

## Fase 9: Dashboard Completo

### 9.1 - Dashboard Admin 📊

**Arquivo:** `admin/src/app/admin/dashboard/page.tsx`

**Status Atual:**
- ❌ Mock data estático
- ❌ Sem integração com API real

**Tarefas:**

1. **Estatísticas Financeiras** ⭐
   * [ ] Card: Total a Pagar (faturas pendentes)
   * [ ] Card: Total Pago (faturas pagas no mês)
   * [ ] Card: Faturas Vencidas
   * [ ] Card: Próximas a Vencer (7 dias)
   * [ ] Gráfico: Fluxo de caixa mensal
   * [ ] Integrar com `/api/v1/dashboard/stats`

2. **Estatísticas de Estoque** ⭐
   * [ ] Card: Total de Produtos
   * [ ] Card: Produtos com Estoque Baixo
   * [ ] Card: Produtos com Estoque Crítico (zero)
   * [ ] Card: Valor Total em Estoque
   * [ ] Lista: Top 5 produtos mais vendidos
   * [ ] Alerta visual para produtos críticos

3. **Estatísticas de Vendas** ⭐
   * [ ] Card: Vendas do Mês
   * [ ] Card: Ticket Médio
   * [ ] Card: Total de Vendas (ano)
   * [ ] Gráfico: Vendas por mês (últimos 6 meses)
   * [ ] Lista: Últimas 10 vendas

4. **Atividades Recentes** ⭐
   * [ ] Timeline de atividades:
     - Faturas criadas/pagas
     - Produtos criados/editados
     - Vendas realizadas
     - Fornecedores adicionados
   * [ ] Filtro por tipo de atividade
   * [ ] Links diretos para detalhes

---

## Fase 10: Melhorias de UX/UI

### 10.1 - Componentes Reutilizáveis

**Tarefas:**

1. **Componente de Tabela Genérico** ⭐⭐
   * [ ] Criar `<DataTable>` com:
     - Paginação integrada
     - Ordenação por colunas
     - Filtros por coluna
     - Busca global
     - Ações por linha (editar, deletar, visualizar)
     - Loading state
     - Empty state
   * [ ] TypeScript genérico para type safety
   * [ ] Estilização consistente

2. **Componente de Modal Genérico** ⭐
   * [ ] Criar `<FormModal>` com:
     - Header customizável
     - Body com children
     - Footer com botões (Cancelar, Salvar)
     - Loading state
     - Validação de formulário
     - Keyboard shortcuts (ESC, Enter)

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
   * [ ] Implementar uso em formulários (próximo passo)

2. **Loading States** ⭐
   * [ ] Skeletons para tabelas
   * [ ] Spinners para botões
   * [ ] Overlay para modals
   * [ ] Feedback visual em todas as ações assíncronas

3. **Empty States** ⭐
   * [ ] Mensagens amigáveis quando não há dados
   * [ ] Ilustrações ou ícones
   * [ ] Call-to-action (ex: "Criar primeira fatura")

4. **Error Handling** ⭐⭐
   * [ ] Boundary de erro global
   * [ ] Mensagens de erro user-friendly
   * [ ] Retry automático em falhas de rede
   * [ ] Log de erros (opcional)

---

## Fase 11: Recursos Avançados

### 11.1 - Busca e Filtros Avançados

**Tarefas:**

1. **Busca Global** ⭐⭐
   * [ ] Barra de busca no header
   * [ ] Buscar em: faturas, produtos, vendas, fornecedores
   * [ ] Resultados agrupados por tipo
   * [ ] Navegação rápida para resultado
   * [ ] Keyboard shortcut (Ctrl+K)

2. **Filtros Persistentes** ⭐
   * [ ] Salvar filtros no localStorage
   * [ ] Restaurar filtros ao voltar à página
   * [ ] Preset de filtros comuns
   * [ ] Limpar todos os filtros

### 11.2 - Exportação de Dados

**Tarefas:**

1. **Exportar para CSV/Excel** ⭐
   * [ ] Botão "Exportar" em cada listagem
   * [ ] Biblioteca: xlsx ou papaparse
   * [ ] Exportar dados visíveis ou todos
   * [ ] Nome de arquivo com data
   * [ ] Formatação adequada

2. **Imprimir Relatórios** ⭐
   * [ ] CSS para impressão
   * [ ] Botão "Imprimir"
   * [ ] Relatórios de:
     - Faturas do mês
     - Produtos em estoque
     - Vendas do período
   * [ ] Logo e cabeçalho da empresa

### 11.3 - Temas e Personalização

**Tarefas:**

1. **Dark Mode** ⭐
   * [ ] Toggle dark/light mode
   * [ ] Persistir preferência
   * [ ] Atualizar todas as cores
   * [ ] Testar contraste

2. **Personalização** (Bonus)
   * [ ] Logo da empresa
   * [ ] Cores do tema
   * [ ] Nome da empresa no header

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

### Sprint 5 - Módulo Fornecedores (3-4 dias)
1. ✅ Criar página de Fornecedores
2. ✅ CRUD Completo de Fornecedores

### Sprint 6 - Dashboard (3-4 dias)
1. ✅ Integração com API real
2. ✅ Estatísticas dinâmicas
3. ✅ Gráficos

### Sprint 7 - Polimento (3-4 dias)
1. ✅ Exportações
2. ✅ Busca global
3. ✅ Dark mode
4. ✅ Testes e ajustes finais

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
