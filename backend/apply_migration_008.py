#!/usr/bin/env python3
"""
Script para aplicar migration_008_mercadolivre.sql

Uso:
    python apply_migration_008.py
"""

import sys
import os

# Adicionar o diretório app ao path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
import sqlalchemy

def apply_migration():
    """Aplica a migration 008 - Mercado Livre"""

    migration_sql = """
    -- Migration 008: Adicionar campos de integração Mercado Livre
    ALTER TABLE workspaces
    ADD COLUMN IF NOT EXISTS integration_mercadolivre_access_token VARCHAR(500),
    ADD COLUMN IF NOT EXISTS integration_mercadolivre_refresh_token VARCHAR(500),
    ADD COLUMN IF NOT EXISTS integration_mercadolivre_user_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS integration_mercadolivre_last_sync TIMESTAMP,
    ADD COLUMN IF NOT EXISTS integration_mercadolivre_token_expires_at TIMESTAMP;
    """

    print("🔄 Aplicando migration_008_mercadolivre...")
    print("")

    try:
        with engine.connect() as conn:
            # Executar migration
            conn.execute(sqlalchemy.text(migration_sql))
            conn.commit()
            print("✅ Migration aplicada com sucesso!")
            print("")

            # Verificar colunas criadas
            print("🔍 Verificando colunas criadas:")
            result = conn.execute(sqlalchemy.text("""
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'workspaces'
                    AND column_name LIKE 'integration_mercadolivre%'
                ORDER BY column_name;
            """))

            rows = result.fetchall()
            if rows:
                print("")
                for row in rows:
                    col_name, data_type, max_length = row
                    length_str = f"({max_length})" if max_length else ""
                    print(f"  ✓ {col_name}: {data_type}{length_str}")
                print("")
                print(f"✅ {len(rows)} colunas criadas com sucesso!")
            else:
                print("  ⚠️  Nenhuma coluna encontrada (pode indicar erro)")

    except Exception as e:
        print(f"❌ Erro ao aplicar migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
