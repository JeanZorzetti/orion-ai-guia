-- Migration: Add notes column to sales table
-- Problema: Sale model usa campo 'notes' mas a coluna não existe na tabela
-- Solução: Adicionar coluna notes do tipo TEXT nullable

-- Adicionar coluna notes à tabela sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verificação
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'notes';
