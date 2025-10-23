from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db, engine
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.models import Base
import os
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

# CORS configuration - Versão 2.0 com wildcard em produção
cors_origins_str = os.getenv("BACKEND_CORS_ORIGINS", "")
is_production = os.getenv("ENVIRONMENT", "development") == "production"

if cors_origins_str:
    ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
elif is_production:
    # Em produção, aceitar qualquer subdomínio de roilabs.com.br
    ALLOWED_ORIGINS = ["*"]  # Temporário para debug
else:
    # Desenvolvimento
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://orionerp.roilabs.com.br",
        "https://orionback.roilabs.com.br"
    ]

print(f"🌐 CORS Configuration [v2.0]")
print(f"   Environment: {os.getenv('ENVIRONMENT', 'development')}")
print(f"   Origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


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
