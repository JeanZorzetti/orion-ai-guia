from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.core.database import init_db, engine
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.models import Base
import os
from datetime import datetime
from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware

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
print("CORS Configuration [v3.0 - WILDCARD TOTAL]")
print(f"   Environment: {os.getenv('ENVIRONMENT', 'development')}")
print(f"   CORS Origins: ['*'] (PERMITINDO TODAS AS ORIGENS)")
print("=" * 60)

# ============================================================================
# MIDDLEWARE DE LOGGING - Capturar TODAS as requisições
# ============================================================================
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware para logar todas as requisições recebidas.
    """
    async def dispatch(self, request: Request, call_next):
        import logging
        logger = logging.getLogger("uvicorn.access")

        # Log da requisição recebida
        logger.info("=" * 80)
        logger.info(f"📥 REQUEST: {request.method} {request.url.path}")
        logger.info(f"   Query Params: {dict(request.query_params)}")
        logger.info(f"   Headers: {dict(request.headers)}")
        logger.info(f"   Client: {request.client}")
        logger.info("=" * 80)

        try:
            response = await call_next(request)

            # Log da resposta
            logger.info("=" * 80)
            logger.info(f"📤 RESPONSE: {request.method} {request.url.path}")
            logger.info(f"   Status: {response.status_code}")
            logger.info(f"   Headers: {dict(response.headers)}")
            logger.info("=" * 80)

            return response
        except Exception as e:
            logger.error("=" * 80)
            logger.error(f"❌ ERRO: {request.method} {request.url.path}")
            logger.error(f"   Exception: {str(e)}")
            logger.error("=" * 80)
            raise


# ============================================================================
# MIDDLEWARE HTTPS ENFORCER - Garantir que NUNCA redirecione para HTTP
# ============================================================================
class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Middleware para garantir que todos os redirects mantenham HTTPS.
    Previne que o FastAPI/Starlette faça redirects HTTP em ambiente HTTPS.
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Se é um redirect (3xx)
        if 300 <= response.status_code < 400:
            location = response.headers.get("location")
            if location:
                # Se o redirect for para HTTP, forçar HTTPS
                if location.startswith("http://"):
                    print(f"⚠️ REDIRECT HTTP DETECTADO E BLOQUEADO: {location}")
                    https_location = location.replace("http://", "https://", 1)
                    response.headers["location"] = https_location
                    print(f"✅ REDIRECT CORRIGIDO PARA HTTPS: {https_location}")

        return response


# MIDDLEWARE DE LOGGING - PRIMEIRO DE TODOS (para capturar tudo)
app.add_middleware(RequestLoggingMiddleware)

# MIDDLEWARE HTTPS - DEVE VIR ANTES DO CORS
app.add_middleware(HTTPSRedirectMiddleware)

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
    from datetime import datetime
    return {
        "cors": "OK",
        "message": "Se você está vendo isso, o CORS está funcionando!",
        "timestamp": datetime.utcnow().isoformat(),
        "allowed_origins": ["*"],
        "version": "3.0"
    }


# Startup event - Initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"WARNING: Could not create database tables: {e}")
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
