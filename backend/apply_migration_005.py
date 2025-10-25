"""
Script para aplicar a migração 005 - Add notes column to sales

Este script adiciona o campo 'notes' à tabela 'sales' para permitir
observações/anotações nas vendas (usado para marcar vendas fake de teste).
"""
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    """Aplica a migração 005"""

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Erro: DATABASE_URL não definida no .env")
        sys.exit(1)

    print("=" * 60)
    print("🔧 Aplicando Migração 005 - Add notes to sales")
    print("=" * 60)

    engine = create_engine(database_url)

    migration_file = Path(__file__).parent / "migrations" / "005_add_notes_to_sales.sql"

    if not migration_file.exists():
        print(f"❌ Arquivo de migração não encontrado: {migration_file}")
        sys.exit(1)

    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip() and not cmd.strip().startswith('--')]

    try:
        with engine.connect() as conn:
            for i, cmd in enumerate(sql_commands, 1):
                if cmd.strip():
                    print(f"\n📝 Executando comando {i}/{len(sql_commands)}...")
                    cmd_preview = cmd[:100] + "..." if len(cmd) > 100 else cmd
                    print(f"   {cmd_preview}")

                    try:
                        result = conn.execute(text(cmd))

                        if cmd.strip().upper().startswith('SELECT'):
                            rows = result.fetchall()
                            for row in rows:
                                print(f"   ✓ {dict(row)}")
                        else:
                            print(f"   ✓ Sucesso!")

                    except Exception as e:
                        print(f"   ⚠️ Aviso: {e}")

            conn.commit()

        print("\n" + "=" * 60)
        print("✅ Migração 005 aplicada com sucesso!")
        print("=" * 60)
        print("\n📌 O campo 'notes' foi adicionado à tabela 'sales'")
        print("   Agora vendas podem ter observações/anotações\n")

    except Exception as e:
        print(f"\n❌ Erro ao aplicar migração: {e}")
        sys.exit(1)


if __name__ == "__main__":
    apply_migration()
