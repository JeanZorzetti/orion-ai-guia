-- Migration: Create stock_adjustments table
-- Problema: Ajustes de estoque não têm histórico/auditoria
-- Solução: Criar tabela para registrar todos os ajustes

-- Criar tabela stock_adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Detalhes do ajuste
    adjustment_type VARCHAR NOT NULL CHECK (adjustment_type IN ('in', 'out', 'correction')),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL CHECK (new_quantity >= 0),
    reason TEXT NOT NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Índices
    CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_workspace_id ON stock_adjustments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_product_id ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_user_id ON stock_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_created_at ON stock_adjustments(created_at DESC);

-- Verificação
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_adjustments'
ORDER BY ordinal_position;
