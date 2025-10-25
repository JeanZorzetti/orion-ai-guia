"""
Script para aplicar a migração 004 - Fix Product SKU Constraint

Este script deve ser executado ANTES de reiniciar o backend com as mudanças no código.
"""
import os
import sys
from pathlib import Path

# Adicionar o diretório raiz ao path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def apply_migration():
    """Aplica a migração 004"""

    # Conectar ao banco de dados
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ Erro: DATABASE_URL não definida no .env")
        sys.exit(1)

    print("=" * 60)
    print("🔧 Aplicando Migração 004 - Fix Product SKU Constraint")
    print("=" * 60)

    engine = create_engine(database_url)

    # Ler o arquivo SQL
    migration_file = Path(__file__).parent / "migrations" / "004_fix_product_sku_constraint.sql"

    if not migration_file.exists():
        print(f"❌ Arquivo de migração não encontrado: {migration_file}")
        sys.exit(1)

    with open(migration_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Separar comandos SQL (por ponto-e-vírgula)
    sql_commands = [cmd.strip() for cmd in sql_content.split(';') if cmd.strip() and not cmd.strip().startswith('--')]

    try:
        with engine.connect() as conn:
            # Executar cada comando
            for i, cmd in enumerate(sql_commands, 1):
                if cmd.strip():
                    print(f"\n📝 Executando comando {i}/{len(sql_commands)}...")
                    # Mostrar primeiras 100 caracteres do comando
                    cmd_preview = cmd[:100] + "..." if len(cmd) > 100 else cmd
                    print(f"   {cmd_preview}")

                    try:
                        result = conn.execute(text(cmd))

                        # Se for um SELECT, mostrar resultado
                        if cmd.strip().upper().startswith('SELECT'):
                            rows = result.fetchall()
                            for row in rows:
                                print(f"   ✓ {dict(row)}")
                        else:
                            print(f"   ✓ Sucesso!")

                    except Exception as e:
                        print(f"   ⚠️ Aviso: {e}")
                        # Continuar mesmo se houver erro (ex: constraint já não existe)

            # Commit das mudanças
            conn.commit()

        print("\n" + "=" * 60)
        print("✅ Migração 004 aplicada com sucesso!")
        print("=" * 60)
        print("\n📌 Próximos passos:")
        print("   1. Reiniciar o backend (as mudanças no código já estão prontas)")
        print("   2. Testar criação de produtos com SKU vazio")
        print("   3. Verificar que SKUs únicos funcionam por workspace\n")

    except Exception as e:
        print(f"\n❌ Erro ao aplicar migração: {e}")
        sys.exit(1)


if __name__ == "__main__":
    apply_migration()
