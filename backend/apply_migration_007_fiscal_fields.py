"""
Migration 007: Add Fiscal Fields to Workspace, Product, Sale and create FiscalAuditLog table

This migration adds all necessary fields for NF-e (Nota Fiscal Eletrônica) emission:
- Workspace: Company fiscal data, API credentials, certificate management
- Product: NCM, CEST, tax codes (ICMS, PIS/COFINS, IPI)
- Sale: Customer data, address, NF-e tracking fields
- FiscalAuditLog: New table for fiscal compliance (5 years retention)
"""

import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """Apply migration 007"""

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        print("Starting Migration 007: Fiscal Fields...")

        # Begin transaction
        trans = conn.begin()

        try:
            # ==========================================
            # 1. ALTER TABLE workspaces - Fiscal Fields
            # ==========================================
            print("Adding fiscal fields to workspaces table...")

            workspace_columns = [
                # Dados Fiscais da Empresa
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS cnpj VARCHAR(14)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(20)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(20)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS regime_tributario INTEGER",

                # Endereço Fiscal
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_cep VARCHAR(8)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_logradouro VARCHAR(255)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_numero VARCHAR(20)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_complemento VARCHAR(100)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_bairro VARCHAR(100)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_cidade VARCHAR(100)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_uf VARCHAR(2)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_codigo_municipio VARCHAR(7)",

                # Credenciais API Fiscal
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner VARCHAR(50)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner_api_key VARCHAR(500)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_partner_webhook_token VARCHAR(100)",

                # Certificado Digital
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_uploaded_at TIMESTAMP",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_expires_at TIMESTAMP",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS certificate_status VARCHAR(20) DEFAULT 'not_uploaded'",

                # Configurações de Notas
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_serie INTEGER DEFAULT 1",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_next_number INTEGER DEFAULT 1",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS nfe_ambiente INTEGER DEFAULT 2",

                # Metadata
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_config_updated_at TIMESTAMP",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS fiscal_config_updated_by INTEGER REFERENCES users(id)",

                # Integração Shopify
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_store_url VARCHAR(255)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_api_key VARCHAR(500)",
                "ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS integration_shopify_last_sync TIMESTAMP",
            ]

            for sql in workspace_columns:
                conn.execute(text(sql))

            print("✓ Workspace fiscal fields added")

            # ==========================================
            # 2. ALTER TABLE products - Fiscal Fields
            # ==========================================
            print("Adding fiscal fields to products table...")

            product_columns = [
                # Dados Fiscais
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS ncm_code VARCHAR(8)",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS cest_code VARCHAR(7)",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS origin INTEGER DEFAULT 0",

                # ICMS
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_csosn VARCHAR(4)",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_cst VARCHAR(3)",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS icms_aliquota NUMERIC(5,2) DEFAULT 0.00",

                # PIS/COFINS
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS pis_cst VARCHAR(2) DEFAULT '99'",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS pis_aliquota NUMERIC(5,2) DEFAULT 0.00",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS cofins_cst VARCHAR(2) DEFAULT '99'",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS cofins_aliquota NUMERIC(5,2) DEFAULT 0.00",

                # IPI
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS ipi_cst VARCHAR(2)",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS ipi_aliquota NUMERIC(5,2) DEFAULT 0.00",

                # Informações Adicionais
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS fiscal_description TEXT",
                "ALTER TABLE products ADD COLUMN IF NOT EXISTS unidade_tributavel VARCHAR(10) DEFAULT 'UN'",
            ]

            for sql in product_columns:
                conn.execute(text(sql))

            print("✓ Product fiscal fields added")

            # ==========================================
            # 3. ALTER TABLE sales - Customer & NF-e Fields
            # ==========================================
            print("Adding customer and NF-e fields to sales table...")

            # Rename customer_document to customer_cpf_cnpj if exists
            conn.execute(text("""
                DO $$
                BEGIN
                    IF EXISTS(SELECT 1 FROM information_schema.columns
                             WHERE table_name='sales' AND column_name='customer_document') THEN
                        ALTER TABLE sales RENAME COLUMN customer_document TO customer_cpf_cnpj;
                    END IF;
                END $$;
            """))

            sale_columns = [
                # Dados do Cliente
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cpf_cnpj VARCHAR(14)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20)",

                # Endereço do Cliente
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cep VARCHAR(8)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_logradouro VARCHAR(255)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_numero VARCHAR(20)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_complemento VARCHAR(100)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_bairro VARCHAR(100)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_cidade VARCHAR(100)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_uf VARCHAR(2)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_codigo_municipio VARCHAR(7)",

                # Rastreamento NF-e
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_status VARCHAR(20) DEFAULT 'pending'",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_id_partner VARCHAR(100)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_chave VARCHAR(44)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_numero INTEGER",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_serie INTEGER",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_xml_url VARCHAR(500)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_danfe_url VARCHAR(500)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_protocolo VARCHAR(50)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_issued_at TIMESTAMP",

                # Erros
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_rejection_reason TEXT",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_rejection_code VARCHAR(10)",

                # Cancelamento
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_cancelled_at TIMESTAMP",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS nfe_cancellation_reason TEXT",

                # Natureza da Operação
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS natureza_operacao VARCHAR(100) DEFAULT 'Venda de mercadoria'",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS cfop VARCHAR(4) DEFAULT '5102'",

                # Origem
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS origin_channel VARCHAR(50)",
                "ALTER TABLE sales ADD COLUMN IF NOT EXISTS origin_order_id VARCHAR(100)",
            ]

            for sql in sale_columns:
                conn.execute(text(sql))

            print("✓ Sale customer and NF-e fields added")

            # ==========================================
            # 4. CREATE TABLE fiscal_audit_log
            # ==========================================
            print("Creating fiscal_audit_log table...")

            conn.execute(text("""
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
                )
            """))

            # Create indexes for fiscal_audit_log
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_workspace ON fiscal_audit_log(workspace_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_sale ON fiscal_audit_log(sale_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_action ON fiscal_audit_log(action)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_fiscal_audit_log_created ON fiscal_audit_log(created_at)"))

            print("✓ FiscalAuditLog table created with indexes")

            # Commit transaction
            trans.commit()
            print("\n✅ Migration 007 completed successfully!")

        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"\n❌ Migration 007 failed: {str(e)}")
            raise

if __name__ == "__main__":
    run_migration()
