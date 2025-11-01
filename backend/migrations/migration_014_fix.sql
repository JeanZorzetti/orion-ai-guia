-- Migration 014 FIX: Accounts Payable Module - Versão Incremental
-- Este script pode ser executado múltiplas vezes sem erro
-- Cria apenas o que ainda não existe

-- ============================================
-- 1. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(10),
    bank_name VARCHAR(100),
    bank_code VARCHAR(10),
    agency VARCHAR(20),
    account_number VARCHAR(30),
    account_type VARCHAR(20),
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(20),
    payment_term_days INTEGER DEFAULT 30,
    credit_limit FLOAT DEFAULT 0,
    discount_percentage FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    tags JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para suppliers (com DROP IF EXISTS antes de criar)
DROP INDEX IF EXISTS idx_suppliers_workspace;
CREATE INDEX idx_suppliers_workspace ON suppliers(workspace_id);

DROP INDEX IF EXISTS idx_suppliers_name;
CREATE INDEX idx_suppliers_name ON suppliers(name);

DROP INDEX IF EXISTS idx_suppliers_cnpj;
CREATE INDEX idx_suppliers_cnpj ON suppliers(cnpj);

DROP INDEX IF EXISTS idx_suppliers_cpf;
CREATE INDEX idx_suppliers_cpf ON suppliers(cpf);


-- ============================================
-- 2. ACCOUNTS PAYABLE INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts_payable_invoices (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_key VARCHAR(44),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    gross_value FLOAT NOT NULL,
    discount_percentage FLOAT DEFAULT 0,
    discount_value FLOAT DEFAULT 0,
    discount_available_until DATE,
    additional_charges FLOAT DEFAULT 0,
    total_value FLOAT NOT NULL,
    paid_value FLOAT DEFAULT 0,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(255),
    bank_account_id INTEGER REFERENCES cash_flow_bank_accounts(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'approved', 'paid', 'cancelled', 'overdue')),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    cost_center VARCHAR(100),
    project_code VARCHAR(100),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule JSONB,
    parent_invoice_id INTEGER REFERENCES accounts_payable_invoices(id),
    attachments JSONB,
    notes TEXT,
    tags JSONB,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para accounts_payable_invoices
DROP INDEX IF EXISTS idx_ap_invoices_workspace;
CREATE INDEX idx_ap_invoices_workspace ON accounts_payable_invoices(workspace_id);

DROP INDEX IF EXISTS idx_ap_invoices_supplier;
CREATE INDEX idx_ap_invoices_supplier ON accounts_payable_invoices(supplier_id);

DROP INDEX IF EXISTS idx_ap_invoices_number;
CREATE INDEX idx_ap_invoices_number ON accounts_payable_invoices(invoice_number);

DROP INDEX IF EXISTS idx_ap_invoices_key;
CREATE INDEX idx_ap_invoices_key ON accounts_payable_invoices(invoice_key);

DROP INDEX IF EXISTS idx_ap_invoices_invoice_date;
CREATE INDEX idx_ap_invoices_invoice_date ON accounts_payable_invoices(invoice_date);

DROP INDEX IF EXISTS idx_ap_invoices_due_date;
CREATE INDEX idx_ap_invoices_due_date ON accounts_payable_invoices(due_date);

DROP INDEX IF EXISTS idx_ap_invoices_payment_date;
CREATE INDEX idx_ap_invoices_payment_date ON accounts_payable_invoices(payment_date);

DROP INDEX IF EXISTS idx_ap_invoices_status;
CREATE INDEX idx_ap_invoices_status ON accounts_payable_invoices(status);

DROP INDEX IF EXISTS idx_ap_invoices_category;
CREATE INDEX idx_ap_invoices_category ON accounts_payable_invoices(category);

DROP INDEX IF EXISTS idx_ap_invoices_created_at;
CREATE INDEX idx_ap_invoices_created_at ON accounts_payable_invoices(created_at);


-- ============================================
-- 3. INVOICE INSTALLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_installments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES accounts_payable_invoices(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    value FLOAT NOT NULL,
    paid_value FLOAT DEFAULT 0,
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'approved', 'paid', 'cancelled', 'overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para invoice_installments
DROP INDEX IF EXISTS idx_installments_invoice;
CREATE INDEX idx_installments_invoice ON invoice_installments(invoice_id);

DROP INDEX IF EXISTS idx_installments_due_date;
CREATE INDEX idx_installments_due_date ON invoice_installments(due_date);


-- ============================================
-- 4. PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES accounts_payable_invoices(id) ON DELETE CASCADE,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(255),
    bank_account_id INTEGER REFERENCES cash_flow_bank_accounts(id),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para payment_history
DROP INDEX IF EXISTS idx_payment_history_invoice;
CREATE INDEX idx_payment_history_invoice ON payment_history(invoice_id);

DROP INDEX IF EXISTS idx_payment_history_date;
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);


-- ============================================
-- 5. SUPPLIER CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_contacts (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    receives_invoices BOOLEAN DEFAULT FALSE,
    receives_statements BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para supplier_contacts
DROP INDEX IF EXISTS idx_supplier_contacts_supplier;
CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);


-- ============================================
-- 6. FUNÇÃO E TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (com DROP IF EXISTS antes de criar)
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ap_invoices_updated_at ON accounts_payable_invoices;
CREATE TRIGGER update_ap_invoices_updated_at
    BEFORE UPDATE ON accounts_payable_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_installments_updated_at ON invoice_installments;
CREATE TRIGGER update_installments_updated_at
    BEFORE UPDATE ON invoice_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_contacts_updated_at ON supplier_contacts;
CREATE TRIGGER update_supplier_contacts_updated_at
    BEFORE UPDATE ON supplier_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 7. COMMENTS (Documentação)
-- ============================================
COMMENT ON TABLE suppliers IS 'Cadastro de fornecedores para contas a pagar';
COMMENT ON TABLE accounts_payable_invoices IS 'Faturas a pagar (Contas a Pagar)';
COMMENT ON TABLE invoice_installments IS 'Parcelas de faturas a pagar';
COMMENT ON TABLE payment_history IS 'Histórico de pagamentos de faturas';
COMMENT ON TABLE supplier_contacts IS 'Contatos dos fornecedores';

COMMENT ON COLUMN accounts_payable_invoices.status IS 'Status: pending, validated, approved, paid, cancelled, overdue';
COMMENT ON COLUMN accounts_payable_invoices.discount_available_until IS 'Data limite para aproveitamento de desconto por pagamento antecipado';
COMMENT ON COLUMN accounts_payable_invoices.is_recurring IS 'Indica se é uma fatura recorrente (mensal, anual, etc)';
COMMENT ON COLUMN accounts_payable_invoices.parent_invoice_id IS 'Referência à fatura pai para faturas recorrentes';


-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('suppliers', 'accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts');

    RAISE NOTICE '✅ Migration 014 concluída com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: %', table_count;

    IF table_count = 5 THEN
        RAISE NOTICE '✅ Todas as 5 tabelas foram criadas corretamente!';
    ELSE
        RAISE WARNING '⚠️ Esperado 5 tabelas, encontrado %', table_count;
    END IF;
END $$;
