-- Migration 008: Adicionar campos de integração Mercado Livre
-- Data: 2025-10-26
-- Descrição: Campos para OAuth 2.0 e sincronização de pedidos do Mercado Livre

-- Adicionar campos de integração Mercado Livre ao workspace
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS integration_mercadolivre_access_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_mercadolivre_refresh_token VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_mercadolivre_user_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS integration_mercadolivre_last_sync TIMESTAMP,
ADD COLUMN IF NOT EXISTS integration_mercadolivre_token_expires_at TIMESTAMP;

-- Comentários para documentação
COMMENT ON COLUMN workspaces.integration_mercadolivre_access_token IS 'Access token OAuth 2.0 do Mercado Livre (CRIPTOGRAFADO)';
COMMENT ON COLUMN workspaces.integration_mercadolivre_refresh_token IS 'Refresh token OAuth 2.0 do Mercado Livre (CRIPTOGRAFADO)';
COMMENT ON COLUMN workspaces.integration_mercadolivre_user_id IS 'User ID do seller no Mercado Livre';
COMMENT ON COLUMN workspaces.integration_mercadolivre_last_sync IS 'Timestamp da última sincronização de pedidos';
COMMENT ON COLUMN workspaces.integration_mercadolivre_token_expires_at IS 'Data/hora de expiração do access token';

-- Verificação
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'workspaces'
    AND column_name LIKE 'integration_mercadolivre%'
ORDER BY column_name;
