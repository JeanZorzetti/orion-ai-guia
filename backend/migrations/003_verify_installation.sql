-- ============================================================================
-- ORION ERP - Verificação da Instalação
-- Execute este script para verificar se tudo foi criado corretamente
-- ============================================================================

-- 1. Listar todas as tabelas criadas
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar Foreign Keys (Multi-tenant isolation)
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 3. Verificar Indexes criados
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Contar registros em cada tabela
SELECT 'workspaces' as tabela, COUNT(*) as total FROM workspaces
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales;

-- 5. Verificar usuário admin criado
SELECT
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.active,
    w.name as workspace_name,
    w.slug as workspace_slug
FROM users u
LEFT JOIN workspaces w ON u.workspace_id = w.id
ORDER BY u.created_at;

-- 6. Verificar triggers de updated_at
SELECT
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- ============================================================================
-- RESULTADO ESPERADO:
-- - 6 tabelas criadas (workspaces, users, suppliers, invoices, products, sales)
-- - Todas as tabelas (exceto workspaces) devem ter FK para workspace_id
-- - 1 workspace criado
-- - 1 usuário admin criado
-- - Todos os triggers de updated_at ativos
-- ============================================================================
