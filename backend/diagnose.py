#!/usr/bin/env python3
# Diagnóstico simples para verificar se o Python e as dependências estão funcionando

print("🔍 Executando diagnóstico...")

try:
    import fastapi
    print(f"✅ FastAPI versão {fastapi.__version__} importado com sucesso")
except ImportError as e:
    print(f"❌ Erro ao importar FastAPI: {e}")

try:
    import uvicorn
    print(f"✅ Uvicorn importado com sucesso")
except ImportError as e:
    print(f"❌ Erro ao importar Uvicorn: {e}")

try:
    import pydantic
    print(f"✅ Pydantic versão {pydantic.__version__} importado com sucesso")
except ImportError as e:
    print(f"❌ Erro ao importar Pydantic: {e}")

print("🔍 Testando import do main.py...")
try:
    from main import app
    print("✅ main.py importado com sucesso")
    print(f"✅ App FastAPI criado: {type(app)}")
except Exception as e:
    print(f"❌ Erro ao importar main.py: {e}")

print("✅ Diagnóstico concluído!")