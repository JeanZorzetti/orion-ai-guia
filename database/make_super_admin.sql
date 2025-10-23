-- Script para tornar um usuário Super Admin
-- Execute este script no PostgreSQL (Easypanel)

-- Tornar jeanzorzetti@gmail.com um super admin
UPDATE users
SET role = 'super_admin'
WHERE email = 'jeanzorzetti@gmail.com';

-- Verificar a mudança
SELECT id, email, full_name, role, workspace_id, active
FROM users
WHERE email = 'jeanzorzetti@gmail.com';

-- Se quiser tornar outro usuário super admin, use:
-- UPDATE users SET role = 'super_admin' WHERE email = 'outro@email.com';
