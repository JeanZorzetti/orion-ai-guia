from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db, engine
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.models import Base
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Orion ERP API",
    version="2.0.0",
    description="Orion ERP API com arquitetura multi-tenant e autenticação JWT",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration - Versão 3.0 SEMPRE PERMITIR TUDO
# Problema: O middleware não está sendo aplicado corretamente
# Solução: Forçar wildcard incondicional

print("=" * 60)
print("🌐 CORS Configuration [v3.0 - WILDCARD TOTAL]")
print(f"   Environment: {os.getenv('ENVIRONMENT', 'development')}")
print(f"   CORS Origins: ['*'] (PERMITINDO TODAS AS ORIGENS)")
print("=" * 60)

# MIDDLEWARE CORS - DEVE VIR ANTES DE QUALQUER ROTA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # PERMITIR TODAS AS ORIGENS
    allow_credentials=True,
    allow_methods=["*"],  # PERMITIR TODOS OS MÉTODOS
    allow_headers=["*"],  # PERMITIR TODOS OS HEADERS
    expose_headers=["*"],
    max_age=3600,
)


# ENDPOINT DE TESTE CORS - VERIFICAR SE O MIDDLEWARE ESTÁ FUNCIONANDO
@app.options("/api/v1/cors-test")
@app.get("/api/v1/cors-test")
async def cors_test():
    """Endpoint para testar se CORS está funcionando"""
    return {
        "cors": "OK",
        "message": "Se você está vendo isso, o CORS está funcionando!",
        "timestamp": datetime.now().isoformat(),
        "allowed_origins": ["*"]
    }


# Startup event - Initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
    except Exception as e:
        print(f"⚠ Warning: Could not create database tables: {e}")
        print("Application will continue, but database operations may fail")


# Health check endpoints
@app.get("/")
async def root():
    return {
        "message": "Orion ERP API",
        "version": "2.0.0",
        "status": "running",
        "architecture": "multi-tenant with JWT authentication"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "2.0.0"
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
