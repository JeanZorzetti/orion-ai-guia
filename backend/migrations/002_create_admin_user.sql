-- ============================================================================
-- ORION ERP - Criar Usuário Administrador de Teste
-- ============================================================================
-- IMPORTANTE: Este script cria um usuário admin para testes
-- Email: admin@orion.com
-- Senha: admin123
-- ============================================================================

-- 1. Criar workspace para o admin (se não existir)
INSERT INTO workspaces (name, slug, active)
VALUES ('Admin Workspace', 'admin-workspace', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Criar usuário administrador
-- Senha 'admin123' hasheada com bcrypt
-- Hash gerado: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeOUZshk7AaK
INSERT INTO users (
    workspace_id,
    email,
    hashed_password,
    full_name,
    role,
    active
)
VALUES (
    (SELECT id FROM workspaces WHERE slug = 'admin-workspace' LIMIT 1),
    'admin@orion.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeOUZshk7AaK',
    'Administrador',
    'admin',
    true
)
ON CONFLICT (email) DO NOTHING;

-- 3. Verificar usuário criado
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    w.name as workspace_name,
    u.created_at
FROM users u
JOIN workspaces w ON u.workspace_id = w.id
WHERE u.email = 'admin@orion.com';

-- ============================================================================
-- CREDENCIAIS DE TESTE:
-- Email: admin@orion.com
-- Senha: admin123
-- ============================================================================
