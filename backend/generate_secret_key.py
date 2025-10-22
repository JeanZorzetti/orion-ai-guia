#!/usr/bin/env python3
"""
Script para gerar SECRET_KEY forte para JWT
Execute: python generate_secret_key.py
"""
import secrets

# Gerar chave de 64 caracteres (32 bytes em hexadecimal)
secret_key = secrets.token_hex(32)

print("=" * 70)
print("SECRET_KEY GERADA - Copie e use no Easypanel:")
print("=" * 70)
print(secret_key)
print("=" * 70)
print("\nConfigure esta chave no Easypanel em:")
print("sites/orion > Environment > SECRET_KEY")
print("\n⚠ IMPORTANTE: Nunca compartilhe esta chave publicamente!")
