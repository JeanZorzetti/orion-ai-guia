"""
Script para aplicar migration_010_magalu.sql no banco de dados de produção

Execute este script APÓS fazer o deploy do backend com as mudanças no modelo Workspace.

Uso:
    python apply_migration_010.py
"""

import sys
import os
from pathlib import Path

# Adicionar o diretório app ao path para importar os módulos
sys.path.append(str(Path(__file__).parent))

from sqlalchemy import create_engine, text
import sqlalchemy

# Importar as configurações
from app.core.config import settings

def apply_migration():
    """Aplica a migration 010 (Magalu) no banco de dados"""

    print("=" * 60)
    print("APLICANDO MIGRATION 010: Magazine Luiza (Magalu) Integration")
    print("=" * 60)
    print()

    # Criar engine de conexão
    engine = create_engine(settings.DATABASE_URL)

    # SQL da migration
    migration_sql = """
    -- Migration 010: Adicionar campos de integração Magazine Luiza (Magalu)
    ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS integration_magalu_seller_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS integration_magalu_api_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS integration_magalu_last_sync TIMESTAMP;

    -- Comentários das colunas
    COMMENT ON COLUMN workspaces.integration_magalu_seller_id IS 'ID do seller no Magalu Marketplace';
    COMMENT ON COLUMN workspaces.integration_magalu_api_key IS 'API Key do Magalu - CRIPTOGRAFADO';
    COMMENT ON COLUMN workspaces.integration_magalu_last_sync IS 'Timestamp da última sincronização de pedidos';
    """

    try:
        print("Conectando ao banco de dados...")
        print(f"URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'localhost'}")
        print()

        with engine.connect() as conn:
            print("Executando migration...")
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Migration aplicada com sucesso!")
            print()

            # Verificar se as colunas foram criadas
            print("Verificando colunas criadas...")
            result = conn.execute(text("""
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'workspaces'
                AND column_name LIKE 'integration_magalu%'
                ORDER BY column_name;
            """))

            columns = result.fetchall()
            if columns:
                print(f"✅ {len(columns)} coluna(s) Magalu encontrada(s):")
                for col in columns:
                    print(f"   - {col[0]} ({col[1]}{f'({col[2]})' if col[2] else ''})")
            else:
                print("⚠️  Nenhuma coluna Magalu encontrada (pode ser um erro)")

            print()
            print("=" * 60)
            print("MIGRATION 010 CONCLUÍDA")
            print("=" * 60)
            print()
            print("Próximos passos:")
            print("1. Reinicie o backend (se estiver rodando)")
            print("2. Acesse /admin/integracoes no frontend")
            print("3. Configure o Magalu com Seller ID e API Key")
            print()

    except Exception as e:
        print(f"❌ ERRO ao aplicar migration: {str(e)}")
        print()
        print("Detalhes do erro:")
        print(f"  Tipo: {type(e).__name__}")
        print(f"  Mensagem: {str(e)}")
        print()
        print("Possíveis soluções:")
        print("1. Verifique se o banco de dados está acessível")
        print("2. Verifique as variáveis de ambiente (DATABASE_URL)")
        print("3. Verifique se você tem permissões para alterar a tabela")
        print("4. Se as colunas já existem, a migration pode ter sido aplicada anteriormente")
        print()
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    print()
    input("⚠️  ATENÇÃO: Esta migration irá ALTERAR a tabela 'workspaces'. Pressione ENTER para continuar ou Ctrl+C para cancelar...")
    print()
    apply_migration()
