-- ============================================================================
-- ORION ERP - Database Schema Migration
-- Versão: 1.0
-- Descrição: Cria todas as tabelas com arquitetura multi-tenant
-- ============================================================================

-- ============================================================================
-- 1. TABELA: workspaces (Central para Multi-Tenancy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index para busca por slug
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_active ON workspaces(active);

COMMENT ON TABLE workspaces IS 'Workspaces - Representa cada empresa/organização (multi-tenant)';
COMMENT ON COLUMN workspaces.slug IS 'URL-friendly identifier único';

-- ============================================================================
-- 2. TABELA: users (Usuários do Sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

COMMENT ON TABLE users IS 'Usuários do sistema - Isolados por workspace';
COMMENT ON COLUMN users.workspace_id IS 'FK para workspace (multi-tenant isolation)';
COMMENT ON COLUMN users.hashed_password IS 'Senha hash com bcrypt';
COMMENT ON COLUMN users.role IS 'Papel do usuário: user, admin, super_admin';

-- ============================================================================
-- 3. TABELA: suppliers (Fornecedores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    document VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_suppliers_workspace_id ON suppliers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_document ON suppliers(document);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);

COMMENT ON TABLE suppliers IS 'Fornecedores - Isolados por workspace';
COMMENT ON COLUMN suppliers.workspace_id IS 'FK para workspace (multi-tenant isolation)';
COMMENT ON COLUMN suppliers.document IS 'CNPJ ou CPF do fornecedor';

-- ============================================================================
-- 4. TABELA: invoices (Notas Fiscais / Faturas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    net_value DOUBLE PRECISION,
    tax_value DOUBLE PRECISION,
    category VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description TEXT,
    file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_invoices_workspace_id ON invoices(workspace_id);
CREATE INDEX IF NOT EXISTS idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);

COMMENT ON TABLE invoices IS 'Notas Fiscais/Faturas - Isoladas por workspace';
COMMENT ON COLUMN invoices.workspace_id IS 'FK para workspace (multi-tenant isolation)';
COMMENT ON COLUMN invoices.status IS 'Status: pending, validated, paid, cancelled';

-- ============================================================================
-- 5. TABELA: products (Produtos do Estoque)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    category VARCHAR(100),
    cost_price DOUBLE PRECISION DEFAULT 0.0,
    sale_price DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'un',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_products_workspace_id ON products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

COMMENT ON TABLE products IS 'Produtos do estoque - Isolados por workspace';
COMMENT ON COLUMN products.workspace_id IS 'FK para workspace (multi-tenant isolation)';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit - Código único do produto';
COMMENT ON COLUMN products.unit IS 'Unidade de medida: un, kg, l, etc.';

-- ============================================================================
-- 6. TABELA: sales (Vendas Realizadas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_document VARCHAR(50),
    quantity INTEGER NOT NULL,
    unit_price DOUBLE PRECISION NOT NULL,
    total_value DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_sales_workspace_id ON sales(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);

COMMENT ON TABLE sales IS 'Vendas realizadas - Isoladas por workspace';
COMMENT ON COLUMN sales.workspace_id IS 'FK para workspace (multi-tenant isolation)';
COMMENT ON COLUMN sales.status IS 'Status: pending, completed, cancelled';

-- ============================================================================
-- 7. TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. DADOS DE TESTE (Opcional - Pode comentar se não quiser)
-- ============================================================================

-- Criar workspace de teste
INSERT INTO workspaces (name, slug, active)
VALUES ('Empresa Demo', 'empresa-demo', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================

-- Verificar tabelas criadas
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
