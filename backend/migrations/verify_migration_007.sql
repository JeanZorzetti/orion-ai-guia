-- ==========================================
-- Verification Script for Migration 007
-- Run in pgweb to verify all fields were created
-- ==========================================

-- 1. Check WORKSPACES fiscal fields (should return 24 rows)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND (column_name LIKE '%fiscal%'
     OR column_name LIKE '%nfe%'
     OR column_name LIKE '%certificate%'
     OR column_name LIKE '%integration_shopify%'
     OR column_name IN ('cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'inscricao_municipal', 'regime_tributario'))
ORDER BY column_name;

-- Expected count: 24 fields
SELECT COUNT(*) as workspace_fiscal_fields_count
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND (column_name LIKE '%fiscal%'
     OR column_name LIKE '%nfe%'
     OR column_name LIKE '%certificate%'
     OR column_name LIKE '%integration_shopify%'
     OR column_name IN ('cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'inscricao_municipal', 'regime_tributario'));


-- 2. Check PRODUCTS fiscal fields (should return 14 rows)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND (column_name LIKE '%ncm%'
     OR column_name LIKE '%cest%'
     OR column_name LIKE '%icms%'
     OR column_name LIKE '%pis%'
     OR column_name LIKE '%cofins%'
     OR column_name LIKE '%ipi%'
     OR column_name IN ('origin', 'fiscal_description', 'unidade_tributavel'))
ORDER BY column_name;

-- Expected count: 14 fields
SELECT COUNT(*) as product_fiscal_fields_count
FROM information_schema.columns
WHERE table_name = 'products'
AND (column_name LIKE '%ncm%'
     OR column_name LIKE '%cest%'
     OR column_name LIKE '%icms%'
     OR column_name LIKE '%pis%'
     OR column_name LIKE '%cofins%'
     OR column_name LIKE '%ipi%'
     OR column_name IN ('origin', 'fiscal_description', 'unidade_tributavel'));


-- 3. Check SALES customer & NF-e fields (should return 26 rows)
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sales'
AND (column_name LIKE '%customer_%'
     OR column_name LIKE '%nfe_%'
     OR column_name IN ('natureza_operacao', 'cfop', 'origin_channel', 'origin_order_id'))
ORDER BY column_name;

-- Expected count: 26 fields
SELECT COUNT(*) as sale_nfe_fields_count
FROM information_schema.columns
WHERE table_name = 'sales'
AND (column_name LIKE '%customer_%'
     OR column_name LIKE '%nfe_%'
     OR column_name IN ('natureza_operacao', 'cfop', 'origin_channel', 'origin_order_id'));


-- 4. Check FISCAL_AUDIT_LOG table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'fiscal_audit_log';

-- Check fiscal_audit_log columns (should return 13 rows)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'fiscal_audit_log'
ORDER BY ordinal_position;

-- Check fiscal_audit_log indexes (should return 4 indexes)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'fiscal_audit_log'
ORDER BY indexname;


-- 5. Summary Report
SELECT
    'workspaces' as table_name,
    COUNT(*) as fiscal_fields_added,
    '24 expected' as expected
FROM information_schema.columns
WHERE table_name = 'workspaces'
AND (column_name LIKE '%fiscal%'
     OR column_name LIKE '%nfe%'
     OR column_name LIKE '%certificate%'
     OR column_name LIKE '%integration_shopify%'
     OR column_name IN ('cnpj', 'razao_social', 'nome_fantasia', 'inscricao_estadual', 'inscricao_municipal', 'regime_tributario'))

UNION ALL

SELECT
    'products' as table_name,
    COUNT(*) as fiscal_fields_added,
    '14 expected' as expected
FROM information_schema.columns
WHERE table_name = 'products'
AND (column_name LIKE '%ncm%'
     OR column_name LIKE '%cest%'
     OR column_name LIKE '%icms%'
     OR column_name LIKE '%pis%'
     OR column_name LIKE '%cofins%'
     OR column_name LIKE '%ipi%'
     OR column_name IN ('origin', 'fiscal_description', 'unidade_tributavel'))

UNION ALL

SELECT
    'sales' as table_name,
    COUNT(*) as fiscal_fields_added,
    '26 expected' as expected
FROM information_schema.columns
WHERE table_name = 'sales'
AND (column_name LIKE '%customer_%'
     OR column_name LIKE '%nfe_%'
     OR column_name IN ('natureza_operacao', 'cfop', 'origin_channel', 'origin_order_id'))

UNION ALL

SELECT
    'fiscal_audit_log' as table_name,
    COUNT(*) as fiscal_fields_added,
    '13 expected' as expected
FROM information_schema.columns
WHERE table_name = 'fiscal_audit_log';


-- ==========================================
-- All checks complete!
-- If all counts match expected values, migration was successful! ✅
-- ==========================================
