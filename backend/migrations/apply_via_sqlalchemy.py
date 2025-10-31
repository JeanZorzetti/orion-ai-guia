#!/usr/bin/env python3
"""
Script para aplicar migration_014_fix.sql usando SQLAlchemy do backend
"""
import sys
from pathlib import Path

# Adicionar backend ao path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Carregar .env
load_dotenv(backend_path / ".env")

# Usar a conexão externa configurada no .env
EXTERNAL_DATABASE_URL = os.getenv("EXTERNAL_DATABASE_URL", "postgresql://orionerp:PAzo18**@31.97.23.166:5433/orionerp?sslmode=disable")
print(f"Conectando a: {EXTERNAL_DATABASE_URL.replace('PAzo18**', '***')}")
engine = create_engine(EXTERNAL_DATABASE_URL)

def apply_migration():
    print("=" * 70)
    print("APLICANDO MIGRATION 014 - ACCOUNTS PAYABLE MODULE")
    print("=" * 70)

    # Ler arquivo SQL
    migration_file = Path(__file__).parent / "migration_014_ap_only.sql"

    if not migration_file.exists():
        print(f"\n[ERRO] Arquivo nao encontrado: {migration_file}")
        return False

    print(f"\n[INFO] Lendo arquivo: {migration_file.name}")

    try:
        with open(migration_file, "r", encoding="utf-8") as f:
            sql_content = f.read()
    except Exception as e:
        print(f"\n[ERRO] ao ler arquivo SQL: {e}")
        return False

    # Executar SQL
    try:
        print("\n[INFO] Executando migration...")
        with engine.connect() as conn:
            # Executar SQL em uma transação
            conn.execute(text(sql_content))
            conn.commit()
        print("[OK] Migration executada com sucesso!")
    except Exception as e:
        print(f"\n[ERRO] ao executar migration: {e}")
        print("\nDetalhes do erro:")
        import traceback
        traceback.print_exc()
        return False

    # Verificar tabelas criadas
    print("\n[INFO] Verificando tabelas criadas...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts')
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]

            expected_tables = ['accounts_payable_invoices', 'invoice_installments', 'payment_history', 'supplier_contacts']

            print(f"\n[TABELAS] Encontradas ({len(tables)}/{len(expected_tables)}):")
            for table in expected_tables:
                if table in tables:
                    print(f"   [OK] {table}")
                else:
                    print(f"   [FALTA] {table}")

            # Verificar índices
            result = conn.execute(text("""
                SELECT COUNT(*)
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND (
                    indexname LIKE 'idx_ap_%' OR
                    indexname LIKE 'idx_installments%' OR
                    indexname LIKE 'idx_payment%' OR
                    indexname LIKE 'idx_supplier_contacts%'
                )
            """))
            index_count = result.scalar()
            print(f"\n[INDICES] Criados: {index_count}")

            # Verificar triggers
            result = conn.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.triggers
                WHERE trigger_schema = 'public'
                AND event_object_table IN ('accounts_payable_invoices', 'invoice_installments', 'supplier_contacts')
            """))
            trigger_count = result.scalar()
            print(f"[TRIGGERS] Criados: {trigger_count}")

    except Exception as e:
        print(f"\n[AVISO] ao verificar tabelas: {e}")

    print("\n" + "=" * 70)
    print("[OK] MIGRATION 014 CONCLUIDA COM SUCESSO!")
    print("=" * 70)

    return True

if __name__ == '__main__':
    try:
        success = apply_migration()
        if success:
            print("\n[SUCESSO] Tudo pronto! O modulo de Accounts Payable esta configurado.")
        else:
            print("\n[AVISO] Houve problemas durante a migration. Verifique os erros acima.")
    except Exception as e:
        print(f'\n[ERRO FATAL] {e}')
        import traceback
        traceback.print_exc()
