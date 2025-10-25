-- Migration: Fix Product SKU Unique Constraint
-- Problema: SKU tem constraint UNIQUE global, mas deveria ser por workspace
-- Solução: Remover constraint antiga e criar nova (workspace_id + sku)

-- 1. Remover a constraint antiga products_sku_key
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;

-- 2. Converter todos os SKUs vazios para NULL
-- PostgreSQL trata NULL de forma especial em constraints UNIQUE
UPDATE products SET sku = NULL WHERE sku = '';

-- 3. Criar nova constraint composta (workspace_id + sku)
-- Permite múltiplos NULLs, mas SKUs não-vazios devem ser únicos por workspace
ALTER TABLE products
ADD CONSTRAINT uq_workspace_sku
UNIQUE (workspace_id, sku);

-- Verificação
SELECT
    COUNT(*) as total_products,
    COUNT(sku) as products_with_sku,
    COUNT(*) - COUNT(sku) as products_without_sku
FROM products;
