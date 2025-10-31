-- Migration 014 AP ONLY: Apenas tabelas de Accounts Payable
-- Usa a tabela suppliers existente
-- Cria: accounts_payable_invoices, invoice_installments, payment_history, supplier_contacts

-- ============================================
-- 1. ACCOUNTS PAYABLE INVOICES TABLE
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
    bank_account_id INTEGER,
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

-- Indices para accounts_payable_invoices
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
-- 2. INVOICE INSTALLMENTS TABLE
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

-- Indices para invoice_installments
DROP INDEX IF EXISTS idx_installments_invoice;
CREATE INDEX idx_installments_invoice ON invoice_installments(invoice_id);

DROP INDEX IF EXISTS idx_installments_due_date;
CREATE INDEX idx_installments_due_date ON invoice_installments(due_date);


-- ============================================
-- 3. PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES accounts_payable_invoices(id) ON DELETE CASCADE,
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    amount FLOAT NOT NULL,
    payment_method VARCHAR(20),
    payment_reference VARCHAR(255),
    bank_account_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indices para payment_history
DROP INDEX IF EXISTS idx_payment_history_invoice;
CREATE INDEX idx_payment_history_invoice ON payment_history(invoice_id);

DROP INDEX IF EXISTS idx_payment_history_date;
CREATE INDEX idx_payment_history_date ON payment_history(payment_date);


-- ============================================
-- 4. SUPPLIER CONTACTS TABLE
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

-- Indices para supplier_contacts
DROP INDEX IF EXISTS idx_supplier_contacts_supplier;
CREATE INDEX idx_supplier_contacts_supplier ON supplier_contacts(supplier_id);


-- ============================================
-- 5. FUNCAO E TRIGGERS PARA UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (com DROP IF EXISTS antes de criar)
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
-- 6. COMMENTS (Documentacao)
-- ============================================
COMMENT ON TABLE accounts_payable_invoices IS 'Faturas a pagar (Contas a Pagar)';
COMMENT ON TABLE invoice_installments IS 'Parcelas de faturas a pagar';
COMMENT ON TABLE payment_history IS 'Historico de pagamentos de faturas';
COMMENT ON TABLE supplier_contacts IS 'Contatos dos fornecedores';

COMMENT ON COLUMN accounts_payable_invoices.status IS 'Status: pending, validated, approved, paid, cancelled, overdue';
COMMENT ON COLUMN accounts_payable_invoices.discount_available_until IS 'Data limite para aproveitamento de desconto por pagamento antecipado';
COMMENT ON COLUMN accounts_payable_invoices.is_recurring IS 'Indica se e uma fatura recorrente (mensal, anual, etc)';
COMMENT ON COLUMN accounts_payable_invoices.parent_invoice_id IS 'Referencia a fatura pai para faturas recorrentes';
