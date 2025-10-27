-- Migration 010: Adicionar campos de integração Magazine Luiza (Magalu)
-- Data: 2025-10-27
-- Descrição: Adiciona campos para armazenar credenciais e estado da integração Magalu

-- Magazine Luiza usa autenticação com Seller ID + API Key
-- Campos necessários:
-- 1. seller_id: ID do seller no Magalu Marketplace
-- 2. api_key: Chave de API fornecida pelo Magalu
-- 3. last_sync: Timestamp da última sincronização

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS integration_magalu_seller_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS integration_magalu_api_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_magalu_last_sync TIMESTAMP;

-- Comentários das colunas
COMMENT ON COLUMN workspaces.integration_magalu_seller_id IS 'ID do seller no Magalu Marketplace';
COMMENT ON COLUMN workspaces.integration_magalu_api_key IS 'API Key do Magalu - CRIPTOGRAFADO';
COMMENT ON COLUMN workspaces.integration_magalu_last_sync IS 'Timestamp da última sincronização de pedidos';
