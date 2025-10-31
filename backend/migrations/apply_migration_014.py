#!/usr/bin/env python3
"""
Script para aplicar Migration 014: Accounts Payable Module

Este script:
1. Conecta ao banco de dados PostgreSQL
2. Executa a migration SQL
3. Verifica se as tabelas foram criadas corretamente
"""

import psycopg2
from psycopg2 import sql
import os
import sys

# Adicionar o diretório pai ao path para importar app.core.config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Fallback para variável de ambiente
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL não encontrada!")
        print("Configure a variável de ambiente DATABASE_URL ou certifique-se de que app.core.config existe.")
        sys.exit(1)


def get_db_connection():
    """Conecta ao banco de dados PostgreSQL"""
    try:
        # Remover prefixo postgresql:// se existir
        db_url = DATABASE_URL.replace("postgresql://", "").replace("postgres://", "")

        # Parse da URL
        if "@" in db_url:
            credentials, host_part = db_url.split("@")
            user, password = credentials.split(":")
            host_db = host_part.split("/")
            host_port = host_db[0].split(":")
            host = host_port[0]
            port = host_port[1] if len(host_port) > 1 else "5432"
            database = host_db[1] if len(host_db) > 1 else "erp_db"
        else:
            print("❌ Formato de DATABASE_URL inválido")
            sys.exit(1)

        conn = psycopg2.connect(
            host=host,
            port=port,
            database=database,
            user=user,
            password=password
        )
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")
        sys.exit(1)


def apply_migration():
    """Aplica a migration 014"""
    print("🚀 Iniciando Migration 014: Accounts Payable Module")
    print("=" * 70)

    # Conectar ao banco
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Ler arquivo SQL
        migration_file = os.path.join(os.path.dirname(__file__), "migration_014_accounts_payable.sql")

        if not os.path.exists(migration_file):
            print(f"❌ Arquivo não encontrado: {migration_file}")
            sys.exit(1)

        with open(migration_file, "r", encoding="utf-8") as f:
            sql_content = f.read()

        print("📄 Arquivo SQL carregado com sucesso")
        print(f"   Tamanho: {len(sql_content)} bytes")
        print()

        # Executar SQL
        print("⚙️  Executando SQL...")
        cursor.execute(sql_content)
        conn.commit()
        print("✅ Migration executada com sucesso!")
        print()

        # Verificar tabelas criadas
        print("🔍 Verificando tabelas criadas...")
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'suppliers',
                'accounts_payable_invoices',
                'invoice_installments',
                'payment_history',
                'supplier_contacts'
            )
            ORDER BY table_name;
        """)

        tables = cursor.fetchall()
        print(f"   ✅ {len(tables)} tabelas encontradas:")
        for table in tables:
            print(f"      • {table[0]}")
        print()

        # Verificar índices
        print("🔍 Verificando índices criados...")
        cursor.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename IN (
                'suppliers',
                'accounts_payable_invoices',
                'invoice_installments',
                'payment_history',
                'supplier_contacts'
            )
            AND schemaname = 'public'
            ORDER BY indexname;
        """)

        indexes = cursor.fetchall()
        print(f"   ✅ {len(indexes)} índices encontrados")
        print()

        # Verificar triggers
        print("🔍 Verificando triggers criados...")
        cursor.execute("""
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers
            WHERE event_object_table IN (
                'suppliers',
                'accounts_payable_invoices',
                'invoice_installments',
                'supplier_contacts'
            )
            ORDER BY trigger_name;
        """)

        triggers = cursor.fetchall()
        print(f"   ✅ {len(triggers)} triggers encontrados:")
        for trigger in triggers:
            print(f"      • {trigger[0]} on {trigger[1]}")
        print()

        # Estatísticas finais
        print("=" * 70)
        print("✅ Migration 014 aplicada com SUCESSO!")
        print()
        print("📊 Resumo:")
        print(f"   • Tabelas criadas: {len(tables)}")
        print(f"   • Índices criados: {len(indexes)}")
        print(f"   • Triggers criados: {len(triggers)}")
        print()
        print("🎉 Módulo de Accounts Payable pronto para uso!")
        print()
        print("📝 Próximos passos:")
        print("   1. Reiniciar o servidor FastAPI")
        print("   2. Testar endpoints em /api/v1/accounts-payable")
        print("   3. Cadastrar fornecedores")
        print("   4. Criar faturas a pagar")
        print()

    except Exception as e:
        conn.rollback()
        print(f"❌ Erro ao executar migration: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    apply_migration()
