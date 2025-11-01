#!/usr/bin/env python3
"""
Script para aplicar migration_014_fix.sql diretamente no banco
"""
import psycopg2
from pathlib import Path

def apply_migration():
    print("=" * 70)
    print("APLICANDO MIGRATION 014 - ACCOUNTS PAYABLE MODULE")
    print("=" * 70)

    #  Conectar ao banco
    try:
        conn = psycopg2.connect(
            host='localhost',
            port=5432,
            database='erp_db',
            user='postgres',
            password='210605'
        )
        print("\n✅ Conectado ao banco de dados com sucesso!")
    except Exception as e:
        print(f"\n❌ ERRO ao conectar ao banco: {e}")
        return False

    cursor = conn.cursor()

    # Ler arquivo SQL
    migration_file = Path(__file__).parent / "migration_014_fix.sql"

    if not migration_file.exists():
        print(f"\n❌ Arquivo não encontrado: {migration_file}")
        return False

    print(f"\n📄 Lendo arquivo: {migration_file.name}")

    try:
        with open(migration_file, "r", encoding="utf-8") as f:
            sql_content = f.read()
    except Exception as e:
        print(f"\n❌ ERRO ao ler arquivo SQL: {e}")
        return False

    # Executar SQL
    try:
        print("\n⚙️  Executando migration...")
        cursor.execute(sql_content)
        conn.commit()
        print("✅ Migration executada com sucesso!")
    except Exception as e:
        conn.rollback()
        print(f"\n❌ ERRO ao executar migration: {e}")
        print("\nDetalhes do erro:")
        import traceback
        traceback.print_exc()
        return False

    # Verificar tabelas criadas
    print("\n📊 Verificando tabelas criadas...")
    try:
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts')
            ORDER BY table_name
        """)
        tables = cursor.fetchall()

        expected_tables = ['accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts']
        found_tables = [t[0] for t in tables]

        print(f"\n📋 Tabelas encontradas ({len(found_tables)}/{len(expected_tables)}):")
        for table in expected_tables:
            if table in found_tables:
                print(f"   ✅ {table}")
            else:
                print(f"   ❌ {table} (NÃO ENCONTRADA)")

        # Verificar índices
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (
                indexname LIKE 'idx_ap_%' OR
                indexname LIKE 'idx_installments%' OR
                indexname LIKE 'idx_payment%' OR
                indexname LIKE 'idx_supplier_contacts%'
            )
        """)
        index_count = cursor.fetchone()[0]
        print(f"\n📑 Índices criados: {index_count}")

        # Verificar triggers
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table IN ('accounts_payable_invoices', 'invoice_installments', 'supplier_contacts')
        """)
        trigger_count = cursor.fetchone()[0]
        print(f"⚡ Triggers criados: {trigger_count}")

    except Exception as e:
        print(f"\n⚠️  AVISO ao verificar tabelas: {e}")

    # Fechar conexão
    cursor.close()
    conn.close()

    print("\n" + "=" * 70)
    print("✅ MIGRATION 014 CONCLUÍDA COM SUCESSO!")
    print("=" * 70)

    return True

if __name__ == '__main__':
    try:
        success = apply_migration()
        if success:
            print("\n✨ Tudo pronto! O módulo de Accounts Payable está configurado.")
        else:
            print("\n⚠️  Houve problemas durante a migration. Verifique os erros acima.")
    except Exception as e:
        print(f'\n❌ ERRO FATAL: {e}')
        import traceback
        traceback.print_exc()
