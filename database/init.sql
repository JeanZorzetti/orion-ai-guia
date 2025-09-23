-- Orion ERP Database Initialization Script

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2),
    cost DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts_payable table
CREATE TABLE IF NOT EXISTS accounts_payable (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date ON accounts_payable(due_date);
CREATE INDEX IF NOT EXISTS idx_accounts_payable_status ON accounts_payable(status);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, name, password_hash, role) VALUES
('admin@orion.com', 'Admin User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LdyGm1Y9h.6z5.6z5e', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for development
INSERT INTO companies (name, cnpj, email, phone, address) VALUES
('Empresa Exemplo Ltda', '12.345.678/0001-90', 'contato@exemplo.com', '(11) 1234-5678', 'Rua Exemplo, 123 - São Paulo, SP')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO products (name, description, sku, price, cost, stock_quantity, min_stock) VALUES
('Produto A', 'Descrição do Produto A', 'PROD-001', 99.99, 50.00, 100, 10),
('Produto B', 'Descrição do Produto B', 'PROD-002', 149.99, 75.00, 50, 5),
('Produto C', 'Descrição do Produto C', 'PROD-003', 199.99, 100.00, 25, 3)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (order_number, customer_name, customer_email, total_amount, status) VALUES
('ORD-001', 'João Silva', 'joao@email.com', 299.97, 'completed'),
('ORD-002', 'Maria Santos', 'maria@email.com', 149.99, 'pending'),
('ORD-003', 'Pedro Oliveira', 'pedro@email.com', 399.96, 'processing')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO accounts_payable (supplier_name, description, amount, due_date, status) VALUES
('Fornecedor ABC', 'Compra de materiais', 1500.00, CURRENT_DATE + INTERVAL '30 days', 'pending'),
('Fornecedor XYZ', 'Serviços de manutenção', 800.00, CURRENT_DATE + INTERVAL '15 days', 'pending'),
('Fornecedor 123', 'Energia elétrica', 450.00, CURRENT_DATE - INTERVAL '5 days', 'overdue')
ON CONFLICT DO NOTHING;