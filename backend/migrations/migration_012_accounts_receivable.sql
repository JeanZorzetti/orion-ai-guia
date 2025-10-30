-- Migration 012: Criar tabela accounts_receivable (Contas a Receber)
-- Data: 2025-01-30
-- Autor: Sistema Orion ERP
-- Descrição: Implementação completa do módulo de Contas a Receber
-- Referência: ROADMAP_FINANCEIRO_INTEGRACAO.md - Fase 1.1

-- ============================================
-- TABELA: accounts_receivable
-- ============================================

CREATE TABLE IF NOT EXISTS accounts_receivable (
    -- Primary Key
    id SERIAL PRIMARY KEY,

    -- Multi-tenant (OBRIGATÓRIO)
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Document Information
    document_number VARCHAR(100) NOT NULL,

    -- Customer Information
    customer_id INTEGER, -- FK futura para tabela customers (quando criada)
    customer_name VARCHAR(255) NOT NULL,
    customer_document VARCHAR(20),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),

    -- Dates
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,

    -- Financial Values
    value DECIMAL(15, 2) NOT NULL CHECK (value > 0),
    paid_value DECIMAL(15, 2) NOT NULL DEFAULT 0.0 CHECK (paid_value >= 0),
    discount_value DECIMAL(15, 2) DEFAULT 0.0 CHECK (discount_value >= 0),
    interest_value DECIMAL(15, 2) DEFAULT 0.0 CHECK (interest_value >= 0),
    net_value DECIMAL(15, 2),

    -- Status and Classification
    status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (
        status IN ('pendente', 'parcial', 'recebido', 'vencido', 'cancelado', 'em_negociacao')
    ),
    risk_category VARCHAR(50) CHECK (
        risk_category IN ('excelente', 'bom', 'regular', 'ruim', 'critico')
    ),
    days_overdue INTEGER NOT NULL DEFAULT 0 CHECK (days_overdue >= 0),

    -- Payment Information
    payment_method VARCHAR(50),
    payment_account VARCHAR(100),

    -- Description and Notes
    description TEXT,
    notes TEXT,
    internal_notes TEXT,

    -- References
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,

    -- Additional Data
    category VARCHAR(100),
    subcategory VARCHAR(100),
    tags JSONB,

    -- Installment Information
    is_installment BOOLEAN DEFAULT FALSE,
    installment_number INTEGER CHECK (installment_number >= 1),
    total_installments INTEGER CHECK (total_installments >= 1),
    parent_receivable_id INTEGER REFERENCES accounts_receivable(id) ON DELETE SET NULL,

    -- Communication Tracking
    last_reminder_sent TIMESTAMP,
    reminder_count INTEGER NOT NULL DEFAULT 0 CHECK (reminder_count >= 0),

    -- Metadata
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES para Performance
-- ============================================

-- Índice principal: workspace + status (queries mais comuns)
CREATE INDEX idx_ar_workspace_status ON accounts_receivable(workspace_id, status);

-- Índice para busca por número do documento
CREATE INDEX idx_ar_workspace_doc ON accounts_receivable(workspace_id, document_number);

-- Índice para busca por data de vencimento (aging reports)
CREATE INDEX idx_ar_workspace_duedate ON accounts_receivable(workspace_id, due_date);

-- Índice para busca por cliente
CREATE INDEX idx_ar_workspace_customer ON accounts_receivable(workspace_id, customer_name);

-- Índice para categoria de risco
CREATE INDEX idx_ar_workspace_risk ON accounts_receivable(workspace_id, risk_category);

-- Índice para contas vencidas (queries frequentes)
CREATE INDEX idx_ar_overdue ON accounts_receivable(workspace_id, due_date, status)
    WHERE status IN ('pendente', 'parcial', 'vencido');

-- Índice para sale_id (relacionamento)
CREATE INDEX idx_ar_sale ON accounts_receivable(sale_id) WHERE sale_id IS NOT NULL;

-- Índice para invoice_id (relacionamento)
CREATE INDEX idx_ar_invoice ON accounts_receivable(invoice_id) WHERE invoice_id IS NOT NULL;

-- ============================================
-- CONSTRAINTS Adicionais
-- ============================================

-- Garantir que document_number é único por workspace
CREATE UNIQUE INDEX idx_ar_unique_doc_workspace
    ON accounts_receivable(workspace_id, document_number);

-- Garantir que due_date >= issue_date
ALTER TABLE accounts_receivable
    ADD CONSTRAINT chk_ar_dates
    CHECK (due_date >= issue_date);

-- Garantir que paid_value <= value (não pode pagar mais que o total)
ALTER TABLE accounts_receivable
    ADD CONSTRAINT chk_ar_paid_value
    CHECK (paid_value <= value);

-- Garantir que installment_number <= total_installments
ALTER TABLE accounts_receivable
    ADD CONSTRAINT chk_ar_installments
    CHECK (
        (is_installment = FALSE) OR
        (installment_number IS NOT NULL AND total_installments IS NOT NULL AND installment_number <= total_installments)
    );

-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_accounts_receivable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ar_updated_at
    BEFORE UPDATE ON accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_receivable_updated_at();

-- ============================================
-- TRIGGER: Calcular net_value automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION calculate_ar_net_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular valor líquido: value + interest - discount
    NEW.net_value = NEW.value + COALESCE(NEW.interest_value, 0) - COALESCE(NEW.discount_value, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ar_net_value
    BEFORE INSERT OR UPDATE ON accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION calculate_ar_net_value();

-- ============================================
-- TRIGGER: Atualizar days_overdue automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_ar_days_overdue()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular dias de atraso se vencido e não recebido/cancelado
    IF NEW.status NOT IN ('recebido', 'cancelado') AND NEW.due_date < CURRENT_DATE THEN
        NEW.days_overdue = CURRENT_DATE - NEW.due_date;

        -- Atualizar status para 'vencido' se necessário
        IF NEW.status = 'pendente' THEN
            NEW.status = 'vencido';
        END IF;
    ELSE
        NEW.days_overdue = 0;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ar_days_overdue
    BEFORE INSERT OR UPDATE ON accounts_receivable
    FOR EACH ROW
    EXECUTE FUNCTION update_ar_days_overdue();

-- ============================================
-- COMENTÁRIOS (Documentação)
-- ============================================

COMMENT ON TABLE accounts_receivable IS
    'Contas a Receber - Controle de valores a receber de clientes';

COMMENT ON COLUMN accounts_receivable.workspace_id IS
    'ID do workspace (multi-tenant) - OBRIGATÓRIO';

COMMENT ON COLUMN accounts_receivable.document_number IS
    'Número do documento (NF, Boleto, Recibo, etc.) - ÚNICO por workspace';

COMMENT ON COLUMN accounts_receivable.status IS
    'Status: pendente, parcial, recebido, vencido, cancelado, em_negociacao';

COMMENT ON COLUMN accounts_receivable.risk_category IS
    'Categoria de risco do cliente: excelente, bom, regular, ruim, critico';

COMMENT ON COLUMN accounts_receivable.days_overdue IS
    'Dias de atraso calculado automaticamente (trigger)';

COMMENT ON COLUMN accounts_receivable.net_value IS
    'Valor líquido = value + interest - discount (calculado por trigger)';

COMMENT ON COLUMN accounts_receivable.is_installment IS
    'Indica se é uma parcela de um pagamento parcelado';

COMMENT ON COLUMN accounts_receivable.parent_receivable_id IS
    'ID da conta a receber "mãe" quando é parcelamento';

-- ============================================
-- VIEW: Resumo por Cliente
-- ============================================

CREATE OR REPLACE VIEW vw_ar_customer_summary AS
SELECT
    workspace_id,
    customer_name,
    customer_document,
    COUNT(*) as total_receivables,
    SUM(value) as total_value,
    SUM(paid_value) as total_paid,
    SUM(value - paid_value) as total_pending,
    SUM(CASE WHEN status = 'vencido' THEN (value - paid_value) ELSE 0 END) as total_overdue,
    AVG(CASE WHEN days_overdue > 0 THEN days_overdue ELSE NULL END) as avg_days_overdue,
    MAX(risk_category) as worst_risk_category
FROM accounts_receivable
WHERE status NOT IN ('recebido', 'cancelado')
GROUP BY workspace_id, customer_name, customer_document;

COMMENT ON VIEW vw_ar_customer_summary IS
    'Resumo de contas a receber agrupado por cliente';

-- ============================================
-- VIEW: Aging Report
-- ============================================

CREATE OR REPLACE VIEW vw_ar_aging_report AS
SELECT
    workspace_id,
    CASE
        WHEN CURRENT_DATE - due_date <= 30 THEN '0-30 dias'
        WHEN CURRENT_DATE - due_date <= 60 THEN '31-60 dias'
        WHEN CURRENT_DATE - due_date <= 90 THEN '61-90 dias'
        ELSE '90+ dias'
    END as aging_bucket,
    COUNT(*) as count,
    SUM(value - paid_value) as total_pending
FROM accounts_receivable
WHERE status IN ('pendente', 'parcial', 'vencido')
GROUP BY workspace_id, aging_bucket;

COMMENT ON VIEW vw_ar_aging_report IS
    'Relatório de aging (envelhecimento) das contas a receber';

-- ============================================
-- DADOS DE TESTE (Opcional - comentado)
-- ============================================

-- Descomente para inserir dados de teste:
/*
INSERT INTO accounts_receivable (
    workspace_id, document_number, customer_name, customer_document,
    issue_date, due_date, value, status, risk_category, category
) VALUES
    (1, 'NF-2025001', 'Empresa ABC Ltda', '12.345.678/0001-90',
     CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
     5000.00, 'pendente', 'excelente', 'Vendas'),
    (1, 'NF-2025002', 'Distribuidora XYZ', '98.765.432/0001-10',
     CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '5 days',
     8500.00, 'vencido', 'regular', 'Vendas');
*/

-- ============================================
-- VERIFICAÇÃO DA MIGRATION
-- ============================================

DO $$
BEGIN
    -- Verificar se a tabela foi criada
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'accounts_receivable') THEN
        RAISE NOTICE '✅ Tabela accounts_receivable criada com sucesso';
    ELSE
        RAISE EXCEPTION '❌ Erro: Tabela accounts_receivable não foi criada';
    END IF;

    -- Verificar índices
    IF EXISTS (SELECT FROM pg_indexes WHERE tablename = 'accounts_receivable' AND indexname = 'idx_ar_workspace_status') THEN
        RAISE NOTICE '✅ Índices criados com sucesso';
    ELSE
        RAISE WARNING '⚠️ Alguns índices podem estar faltando';
    END IF;

    -- Verificar triggers
    IF EXISTS (SELECT FROM pg_trigger WHERE tgname = 'trigger_ar_updated_at') THEN
        RAISE NOTICE '✅ Triggers criados com sucesso';
    ELSE
        RAISE WARNING '⚠️ Alguns triggers podem estar faltando';
    END IF;

    RAISE NOTICE '🎉 Migration 012 concluída com sucesso!';
END $$;
