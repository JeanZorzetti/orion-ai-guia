-- Migration 011: Adicionar campos de integração TikTok Shop
-- Data: 2025-10-27
-- Descrição: Adiciona campos para armazenar credenciais e estado da integração TikTok Shop

-- TikTok Shop usa OAuth 2.0 similar ao Mercado Livre
-- Campos necessários:
-- 1. access_token: Token de acesso OAuth
-- 2. refresh_token: Token para renovar o access_token
-- 3. shop_id: ID da loja no TikTok Shop
-- 4. token_expires_at: Data de expiração do token
-- 5. last_sync: Timestamp da última sincronização

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS integration_tiktokshop_access_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_tiktokshop_refresh_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_tiktokshop_shop_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS integration_tiktokshop_token_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS integration_tiktokshop_last_sync TIMESTAMP;

-- Comentários das colunas
COMMENT ON COLUMN workspaces.integration_tiktokshop_access_token IS 'Access Token OAuth do TikTok Shop - CRIPTOGRAFADO';
COMMENT ON COLUMN workspaces.integration_tiktokshop_refresh_token IS 'Refresh Token OAuth do TikTok Shop - CRIPTOGRAFADO';
COMMENT ON COLUMN workspaces.integration_tiktokshop_shop_id IS 'ID da loja no TikTok Shop';
COMMENT ON COLUMN workspaces.integration_tiktokshop_token_expires_at IS 'Data de expiração do access token';
COMMENT ON COLUMN workspaces.integration_tiktokshop_last_sync IS 'Timestamp da última sincronização de pedidos';
