"""
Script para aplicar Migration 012: Accounts Receivable
Execute: python apply_migration_012.py
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório backend ao path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

try:
    from sqlalchemy import text
    from app.core.database import engine
    print("✅ Imports carregados com sucesso")
except ImportError as e:
    print(f"❌ Erro ao importar: {e}")
    print("💡 Instale as dependências: pip install sqlalchemy psycopg2-binary")
    sys.exit(1)


def apply_migration():
    """Aplica a migration 012"""
    migration_file = Path(__file__).parent / "migration_012_accounts_receivable.sql"

    if not migration_file.exists():
        print(f"❌ Arquivo de migration não encontrado: {migration_file}")
        sys.exit(1)

    print(f"📄 Lendo migration: {migration_file.name}")
    sql_content = migration_file.read_text(encoding='utf-8')

    try:
        print("🔌 Conectando ao banco de dados...")
        with engine.connect() as conn:
            print("✅ Conectado com sucesso!")
            print("🚀 Executando migration 012...")

            # Executar o SQL
            conn.execute(text(sql_content))
            conn.commit()

            print("✅ Migration 012 aplicada com sucesso!")
            print("")
            print("📊 Verificando resultados:")

            # Verificar se a tabela foi criada
            result = conn.execute(text(
                "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'accounts_receivable')"
            ))
            table_exists = result.scalar()

            if table_exists:
                print("   ✅ Tabela 'accounts_receivable' criada")

                # Contar colunas
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM information_schema.columns "
                    "WHERE table_name = 'accounts_receivable'"
                ))
                column_count = result.scalar()
                print(f"   ✅ {column_count} colunas criadas")

                # Contar índices
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM pg_indexes "
                    "WHERE tablename = 'accounts_receivable'"
                ))
                index_count = result.scalar()
                print(f"   ✅ {index_count} índices criados")

                # Contar triggers
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM pg_trigger t "
                    "JOIN pg_class c ON t.tgrelid = c.oid "
                    "WHERE c.relname = 'accounts_receivable'"
                ))
                trigger_count = result.scalar()
                print(f"   ✅ {trigger_count} triggers criados")

                # Contar constraints
                result = conn.execute(text(
                    "SELECT COUNT(*) FROM information_schema.table_constraints "
                    "WHERE table_name = 'accounts_receivable'"
                ))
                constraint_count = result.scalar()
                print(f"   ✅ {constraint_count} constraints criados")

                print("")
                print("🎉 Migration 012 concluída com sucesso!")
                print("")
                print("📝 Próximos passos:")
                print("   1. Reiniciar o backend (se estiver rodando)")
                print("   2. Testar os endpoints em: http://localhost:8000/docs")
                print("   3. Verificar: GET /api/v1/accounts-receivable/")

            else:
                print("❌ Erro: Tabela não foi criada")
                sys.exit(1)

    except Exception as e:
        print(f"❌ Erro ao executar migration: {e}")
        print(f"💡 Verifique se o banco de dados está acessível")
        sys.exit(1)


if __name__ == "__main__":
    print("=" * 60)
    print("🗄️  Orion ERP - Migration 012: Accounts Receivable")
    print("=" * 60)
    print("")

    try:
        apply_migration()
    except KeyboardInterrupt:
        print("\n⚠️  Migration cancelada pelo usuário")
        sys.exit(1)
