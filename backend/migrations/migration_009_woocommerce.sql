-- Migration 009: Adicionar campos de integração WooCommerce
-- Data: 2025-10-27
-- Descrição: Adiciona campos para armazenar credenciais e estado da integração WooCommerce

-- WooCommerce usa autenticação simples com Consumer Key + Consumer Secret
-- Campos necessários:
-- 1. store_url: URL da loja WooCommerce (ex: https://minhaloja.com.br)
-- 2. consumer_key: Chave de API gerada no WooCommerce
-- 3. consumer_secret: Secret de API gerado no WooCommerce
-- 4. last_sync: Timestamp da última sincronização

ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS integration_woocommerce_store_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS integration_woocommerce_consumer_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_woocommerce_consumer_secret VARCHAR(500),
ADD COLUMN IF NOT EXISTS integration_woocommerce_last_sync TIMESTAMP;

-- Comentários das colunas
COMMENT ON COLUMN workspaces.integration_woocommerce_store_url IS 'URL da loja WooCommerce (ex: https://minhaloja.com.br)';
COMMENT ON COLUMN workspaces.integration_woocommerce_consumer_key IS 'Consumer Key da API WooCommerce - CRIPTOGRAFADO';
COMMENT ON COLUMN workspaces.integration_woocommerce_consumer_secret IS 'Consumer Secret da API WooCommerce - CRIPTOGRAFADO';
COMMENT ON COLUMN workspaces.integration_woocommerce_last_sync IS 'Timestamp da última sincronização de pedidos';
