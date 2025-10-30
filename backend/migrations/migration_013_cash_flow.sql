-- Migration 013: Criar tabelas de Fluxo de Caixa (Cash Flow) e Contas Bancárias
-- Data: 2025-01-30
-- Autor: Sistema Orion ERP
-- Descrição: Implementação completa do módulo de Fluxo de Caixa
-- Referência: roadmaps/ROADMAP_FINANCEIRO_INTEGRACAO.md - Fase 2.1 e 2.2

-- ============================================
-- TABELA: bank_accounts (Contas Bancárias)
-- ============================================

CREATE TABLE IF NOT EXISTS bank_accounts (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Multi-tenant (OBRIGATÓRIO)
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Informações da Conta
    bank_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'corrente' CHECK (
        account_type IN ('corrente', 'poupanca', 'investimento', 'caixa')
    ),
    account_number VARCHAR(50),
    agency VARCHAR(20),

    -- Saldos
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.0,
    initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.0,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Detalhes
    description TEXT,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Constraint: Saldo não pode ser negativo (exceto caixa)
    CONSTRAINT check_positive_balance CHECK (
        current_balance >= 0 OR account_type = 'caixa'
    )
);

-- ============================================
-- TABELA: cash_flow_transactions (Movimentações Financeiras)
-- ============================================

CREATE TABLE IF NOT EXISTS cash_flow_transactions (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Multi-tenant (OBRIGATÓRIO)
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Informações da Transação
    transaction_date TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('entrada', 'saida')),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT NOT NULL,

    -- Valor
    value DECIMAL(15, 2) NOT NULL CHECK (value > 0),

    -- Pagamento
    payment_method VARCHAR(50),
    account_id INTEGER REFERENCES bank_accounts(id) ON DELETE SET NULL,

    -- Referências a Documentos
    reference_type VARCHAR(50) CHECK (
        reference_type IN ('invoice', 'sale', 'expense', 'transfer', 'receivable', 'payable', 'other')
    ),
    reference_id INTEGER,

    -- Dados Adicionais
    tags JSONB,
    notes TEXT,

    -- Recorrência
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule JSONB,
    parent_transaction_id INTEGER REFERENCES cash_flow_transactions(id) ON DELETE SET NULL,

    -- Reconciliação
    is_reconciled BOOLEAN NOT NULL DEFAULT FALSE,
    reconciled_at TIMESTAMP,
    reconciled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- ÍNDICES para Performance
-- ============================================

-- Bank Accounts
CREATE INDEX idx_bank_accounts_workspace ON bank_accounts(workspace_id);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(workspace_id, is_active);
CREATE INDEX idx_bank_accounts_type ON bank_accounts(workspace_id, account_type);

-- Cash Flow Transactions
-- Índice principal: workspace + data (queries mais comuns)
CREATE INDEX idx_cf_workspace_date ON cash_flow_transactions(workspace_id, transaction_date DESC);

-- Índice: workspace + tipo (filtros de entrada/saída)
CREATE INDEX idx_cf_workspace_type ON cash_flow_transactions(workspace_id, type);

-- Índice: workspace + categoria (análises por categoria)
CREATE INDEX idx_cf_workspace_category ON cash_flow_transactions(workspace_id, category);

-- Índice: workspace + conta (movimentações por conta)
CREATE INDEX idx_cf_workspace_account ON cash_flow_transactions(workspace_id, account_id);

-- Índice: workspace + referência (busca por documento)
CREATE INDEX idx_cf_workspace_reference ON cash_flow_transactions(workspace_id, reference_type, reference_id);

-- Índice: workspace + reconciliação (filtrar reconciliados)
CREATE INDEX idx_cf_workspace_reconciled ON cash_flow_transactions(workspace_id, is_reconciled);

-- Índice: recorrência (para processar transações recorrentes)
CREATE INDEX idx_cf_recurring ON cash_flow_transactions(workspace_id, is_recurring)
    WHERE is_recurring = TRUE;

-- Índice: busca textual (GIN para JSONB tags)
CREATE INDEX idx_cf_tags ON cash_flow_transactions USING GIN (tags);

-- ============================================
-- TRIGGERS Automáticos
-- ============================================

-- Trigger: Atualizar updated_at automaticamente em bank_accounts
CREATE OR REPLACE FUNCTION update_bank_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bank_account_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_account_timestamp();

-- Trigger: Atualizar updated_at automaticamente em cash_flow_transactions
CREATE OR REPLACE FUNCTION update_cash_flow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cash_flow_updated_at
    BEFORE UPDATE ON cash_flow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_flow_timestamp();

-- ============================================
-- VIEWS Analíticas
-- ============================================

-- View: Resumo de saldo por conta
CREATE OR REPLACE VIEW vw_bank_account_summary AS
SELECT
    ba.id AS account_id,
    ba.workspace_id,
    ba.bank_name,
    ba.account_type,
    ba.current_balance,
    ba.is_active,
    COALESCE(SUM(CASE WHEN cf.type = 'entrada' THEN cf.value ELSE 0 END), 0) AS total_entries,
    COALESCE(SUM(CASE WHEN cf.type = 'saida' THEN cf.value ELSE 0 END), 0) AS total_exits,
    COUNT(cf.id) AS transaction_count,
    MAX(cf.transaction_date) AS last_transaction_date
FROM bank_accounts ba
LEFT JOIN cash_flow_transactions cf ON ba.id = cf.account_id
GROUP BY ba.id, ba.workspace_id, ba.bank_name, ba.account_type, ba.current_balance, ba.is_active;

-- View: Resumo mensal de cash flow
CREATE OR REPLACE VIEW vw_monthly_cash_flow AS
SELECT
    workspace_id,
    DATE_TRUNC('month', transaction_date) AS month,
    SUM(CASE WHEN type = 'entrada' THEN value ELSE 0 END) AS total_entries,
    SUM(CASE WHEN type = 'saida' THEN value ELSE 0 END) AS total_exits,
    SUM(CASE WHEN type = 'entrada' THEN value ELSE -value END) AS net_flow,
    COUNT(*) AS transaction_count,
    COUNT(CASE WHEN type = 'entrada' THEN 1 END) AS entry_count,
    COUNT(CASE WHEN type = 'saida' THEN 1 END) AS exit_count
FROM cash_flow_transactions
GROUP BY workspace_id, DATE_TRUNC('month', transaction_date);

-- View: Análise por categoria
CREATE OR REPLACE VIEW vw_cash_flow_by_category AS
SELECT
    workspace_id,
    category,
    subcategory,
    type,
    SUM(value) AS total_value,
    COUNT(*) AS transaction_count,
    AVG(value) AS avg_value,
    MIN(transaction_date) AS first_transaction,
    MAX(transaction_date) AS last_transaction
FROM cash_flow_transactions
GROUP BY workspace_id, category, subcategory, type;

-- View: Transações não reconciliadas
CREATE OR REPLACE VIEW vw_unreconciled_transactions AS
SELECT
    cf.*,
    ba.bank_name,
    ba.account_type
FROM cash_flow_transactions cf
LEFT JOIN bank_accounts ba ON cf.account_id = ba.id
WHERE cf.is_reconciled = FALSE
ORDER BY cf.transaction_date DESC;

-- ============================================
-- DADOS INICIAIS (Categorias padrão)
-- ============================================

-- Comentário: As categorias são flexíveis e podem ser criadas pelo usuário
-- Exemplos de categorias comuns:
-- ENTRADAS: Vendas, Prestação de Serviços, Investimentos, Empréstimos, Outras Receitas
-- SAÍDAS: Fornecedores, Salários, Impostos, Aluguel, Utilities, Marketing, Outras Despesas

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE bank_accounts IS 'Contas bancárias e caixas da empresa para controle financeiro';
COMMENT ON COLUMN bank_accounts.workspace_id IS 'ID do workspace (multi-tenancy)';
COMMENT ON COLUMN bank_accounts.current_balance IS 'Saldo atual calculado automaticamente pelas transações';
COMMENT ON COLUMN bank_accounts.initial_balance IS 'Saldo inicial ao criar a conta';

COMMENT ON TABLE cash_flow_transactions IS 'Movimentações financeiras (entradas e saídas) da empresa';
COMMENT ON COLUMN cash_flow_transactions.workspace_id IS 'ID do workspace (multi-tenancy)';
COMMENT ON COLUMN cash_flow_transactions.type IS 'Tipo de transação: entrada ou saida';
COMMENT ON COLUMN cash_flow_transactions.value IS 'Valor sempre positivo - tipo define se é entrada ou saída';
COMMENT ON COLUMN cash_flow_transactions.reference_type IS 'Tipo de documento de referência (invoice, sale, etc)';
COMMENT ON COLUMN cash_flow_transactions.reference_id IS 'ID do documento referenciado';
COMMENT ON COLUMN cash_flow_transactions.tags IS 'Tags JSON para categorização flexível';
COMMENT ON COLUMN cash_flow_transactions.recurrence_rule IS 'Regra JSON para transações recorrentes';
COMMENT ON COLUMN cash_flow_transactions.is_reconciled IS 'Flag de reconciliação bancária';

-- ============================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- ============================================

-- Verificar se as tabelas foram criadas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bank_accounts') THEN
        RAISE NOTICE 'Tabela bank_accounts criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao criar tabela bank_accounts';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_flow_transactions') THEN
        RAISE NOTICE 'Tabela cash_flow_transactions criada com sucesso';
    ELSE
        RAISE EXCEPTION 'Falha ao criar tabela cash_flow_transactions';
    END IF;
END $$;

-- ============================================
-- FIM DA MIGRATION 013
-- ============================================
