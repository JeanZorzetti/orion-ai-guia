"""
Script para aplicar migration_011_tiktokshop.sql no banco de dados de produção

Execute este script APÓS fazer o deploy do backend com as mudanças no modelo Workspace.

Uso:
    python apply_migration_011.py
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
    """Aplica a migration 011 (TikTok Shop) no banco de dados"""

    print("=" * 60)
    print("APLICANDO MIGRATION 011: TikTok Shop Integration")
    print("=" * 60)
    print()

    # Criar engine de conexão
    engine = create_engine(settings.DATABASE_URL)

    # SQL da migration
    migration_sql = """
    -- Migration 011: Adicionar campos de integração TikTok Shop
    ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS integration_tiktokshop_access_token VARCHAR(500),
    ADD COLUMN IF NOT EXISTS integration_tiktokshop_refresh_token VARCHAR(500),
    ADD COLUMN IF NOT EXISTS integration_tiktokshop_shop_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS integration_tiktokshop_token_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS integration_tiktokshop_last_sync TIMESTAMP;

    -- Comentários das colunas
    COMMENT ON COLUMN workspaces.integration_tiktokshop_access_token IS 'Access Token OAuth do TikTok Shop - CRIPTOGRAFADO';
    COMMENT ON COLUMN workspaces.integration_tiktokshop_refresh_token IS 'Refresh Token OAuth do TikTok Shop - CRIPTOGRAFADO';
    COMMENT ON COLUMN workspaces.integration_tiktokshop_shop_id IS 'ID da loja no TikTok Shop';
    COMMENT ON COLUMN workspaces.integration_tiktokshop_token_expires_at IS 'Data de expiração do access token';
    COMMENT ON COLUMN workspaces.integration_tiktokshop_last_sync IS 'Timestamp da última sincronização de pedidos';
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
                AND column_name LIKE 'integration_tiktokshop%'
                ORDER BY column_name;
            """))

            columns = result.fetchall()
            if columns:
                print(f"✅ {len(columns)} coluna(s) TikTok Shop encontrada(s):")
                for col in columns:
                    print(f"   - {col[0]} ({col[1]}{f'({col[2]})' if col[2] else ''})")
            else:
                print("⚠️  Nenhuma coluna TikTok Shop encontrada (pode ser um erro)")

            print()
            print("=" * 60)
            print("MIGRATION 011 CONCLUÍDA")
            print("=" * 60)
            print()
            print("Próximos passos:")
            print("1. Reinicie o backend (se estiver rodando)")
            print("2. Acesse /admin/integracoes no frontend")
            print("3. Configure o TikTok Shop com OAuth")
            print("4. Adicione as variáveis TIKTOKSHOP_APP_KEY e TIKTOKSHOP_APP_SECRET no .env")
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
