-- ==========================================
-- Migration 007: Fiscal Fields
-- Run this SQL directly in pgweb
-- ==========================================

-- 1. ALTER TABLE workspaces - Add Fiscal Fields
-- ==========================================

-- Dados Fiscais da Empresa
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS cnpj VARCHAR(14);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(20);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS regime_tributario INTEGER;

-- Endereço Fiscal
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_cep VARCHAR(8);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_logradouro VARCHAR(255);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_numero VARCHAR(20);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_complemento VARCHAR(100);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_bairro VARCHAR(100);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_cidade VARCHAR(100);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_uf VARCHAR(2);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_codigo_municipio VARCHAR(7);

-- Credenciais API Fiscal
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner VARCHAR(50);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner_api_key VARCHAR(500);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner_webhook_token VARCHAR(100);

-- Certificado Digital
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_uploaded_at TIMESTAMP;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMP;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(20) DEFAULT 'not_uploaded';

-- Configurações de Notas
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_serie INTEGER DEFAULT 1;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_next_number INTEGER DEFAULT 1;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_ambiente INTEGER DEFAULT 2;

-- Metadata
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_config_updated_at TIMESTAMP;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_config_updated_by INTEGER REFERENCES users(id);

-- Integração Shopify
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_store_url VARCHAR(255);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_api_key VARCHAR(500);
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_last_sync TIMESTAMP;


-- ==========================================
-- 2. ALTER TABLE products - Add Fiscal Fields
-- ==========================================

-- Dados Fiscais
ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm_code VARCHAR(8);
ALTER TABLE products ADD COLUMN IF NOT EXISTS cest_code VARCHAR(7);
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin INTEGER DEFAULT 0;

-- ICMS
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_csosn VARCHAR(4);
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_cst VARCHAR(3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_aliquota NUMERIC(5,2) DEFAULT 0.00;

-- PIS/COFINS
ALTER TABLE products ADD COLUMN IF NOT EXISTS pis_cst VARCHAR(2) DEFAULT '99';
ALTER TABLE products ADD COLUMN IF NOT EXISTS pis_aliquota NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cofins_cst VARCHAR(2) DEFAULT '99';
ALTER TABLE products ADD COLUMN IF NOT EXISTS cofins_aliquota NUMERIC(5,2) DEFAULT 0.00;

-- IPI
ALTER TABLE products ADD COLUMN IF NOT EXISTS ipi_cst VARCHAR(2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS ipi_aliquota NUMERIC(5,2) DEFAULT 0.00;

-- Informações Adicionais
ALTER TABLE products ADD COLUMN IF NOT EXISTS fiscal_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unidade_tributavel VARCHAR(10) DEFAULT 'UN';


-- ==========================================
-- 3. ALTER TABLE sales - Add Customer & NF-e Fields
-- ==========================================

-- Renomear customer_document para customer_cpf_cnpj (se existir)
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns
             WHERE table_name='sales' AND column_name='customer_document') THEN
        ALTER TABLE sales RENAME COLUMN customer_document TO customer_cpf_cnpj;
    END IF;
END $$;

-- Dados do Cliente
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cpf_cnpj VARCHAR(14);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Endereço do Cliente
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cep VARCHAR(8);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_logradouro VARCHAR(255);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_numero VARCHAR(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_complemento VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_bairro VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cidade VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_uf VARCHAR(2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_codigo_municipio VARCHAR(7);

-- Rastreamento NF-e
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_id_partner VARCHAR(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_chave VARCHAR(44);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_numero INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_serie INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_xml_url VARCHAR(500);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_danfe_url VARCHAR(500);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_protocolo VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_issued_at TIMESTAMP;

-- Erros
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_rejection_reason TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_rejection_code VARCHAR(10);

-- Cancelamento
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_cancelled_at TIMESTAMP;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_cancellation_reason TEXT;

-- Natureza da Operação
ALTER TABLE sales ADD COLUMN IF NOT EXISTS natureza_operacao VARCHAR(100) DEFAULT 'Venda de mercadoria';
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cfop VARCHAR(4) DEFAULT '5102';

-- Origem
ALTER TABLE sales ADD COLUMN IF NOT EXISTS origin_channel VARCHAR(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS origin_order_id VARCHAR(100);


-- ==========================================
-- 4. CREATE TABLE fiscal_audit_log
-- ==========================================

CREATE TABLE IF NOT EXISTS fiscal_audit_log (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    action VARCHAR(50) NOT NULL,

    request_payload JSONB,
    response_payload JSONB,

    error_message TEXT,
    error_code VARCHAR(20),

    ip_address VARCHAR(45),
    user_agent VARCHAR(500),

    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes para fiscal_audit_log
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_workspace ON fiscal_audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_sale ON fiscal_audit_log(sale_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_action ON fiscal_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_created ON fiscal_audit_log(created_at);


-- ==========================================
-- Migration Complete!
-- ==========================================
-- Verify: SELECT column_name FROM information_schema.columns WHERE table_name = 'workspaces' AND column_name LIKE '%fiscal%';
