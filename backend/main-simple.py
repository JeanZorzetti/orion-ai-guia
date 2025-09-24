from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import tempfile
import os
from datetime import datetime

app = FastAPI(
    title="Orion ERP API - Simplified",
    version="1.0.0",
    description="Orion ERP API para desenvolvimento e teste de endpoints"
)

# CORS - URLs de desenvolvimento e produção
ALLOWED_ORIGINS = [
    # URLs de desenvolvimento
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",

    # URLs de produção ROI Labs
    "https://orionerp.roilabs.com.br",
    "https://orionback.roilabs.com.br",
    "https://www.orionerp.roilabs.com.br",
    "https://www.orionback.roilabs.com.br",

    # URLs específicas do admin
    "https://orionerp.roilabs.com.br/admin",

    # URLs de staging (se houver)
    "https://staging-orionerp.roilabs.com.br",
    "https://dev-orionerp.roilabs.com.br"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# === MODELS ===
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class User(BaseModel):
    id: int
    email: str
    name: str
    role: str
    active: bool

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    role: str = "user"

class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    monthly_growth: float

class RecentOrder(BaseModel):
    id: int
    customer_name: str
    amount: float
    status: str
    date: str

class DashboardData(BaseModel):
    stats: DashboardStats
    recent_orders: List[RecentOrder]
    revenue_chart: List[Dict[str, Any]]

# === ROOT ENDPOINTS ===
@app.get("/")
async def root():
    return {"message": "Orion ERP API is running", "version": "1.0.0", "auto_reload": "ATIVO!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# === AUTH ENDPOINTS ===
@app.post("/api/v1/auth/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    if login_data.email == "admin@orion.com" and login_data.password == "admin123":
        return TokenResponse(access_token="fake-jwt-token-here")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password"
    )

@app.post("/api/v1/auth/logout")
async def logout():
    return {"message": "Successfully logged out"}

@app.get("/api/v1/auth/me")
async def get_current_user():
    return {
        "id": 1,
        "email": "admin@orion.com",
        "name": "Admin User",
        "role": "admin"
    }

# === USERS ENDPOINTS ===
@app.get("/api/v1/users/", response_model=List[User])
async def get_users():
    return [
        User(id=1, email="admin@orion.com", name="Admin User", role="admin", active=True),
        User(id=2, email="user@orion.com", name="Regular User", role="user", active=True),
    ]

@app.post("/api/v1/users/", response_model=User)
async def create_user(user_data: UserCreate):
    return User(
        id=3,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        active=True
    )

@app.get("/api/v1/users/{user_id}", response_model=User)
async def get_user(user_id: int):
    return User(
        id=user_id,
        email="user@orion.com",
        name="User Name",
        role="user",
        active=True
    )

# === DASHBOARD ENDPOINTS ===
@app.get("/api/v1/dashboard/", response_model=DashboardData)
async def get_dashboard_data():
    return DashboardData(
        stats=DashboardStats(
            total_revenue=125000.50,
            total_orders=350,
            total_customers=128,
            monthly_growth=12.5
        ),
        recent_orders=[
            RecentOrder(
                id=1,
                customer_name="João Silva",
                amount=1250.00,
                status="completed",
                date="2024-01-15"
            ),
            RecentOrder(
                id=2,
                customer_name="Maria Santos",
                amount=850.50,
                status="pending",
                date="2024-01-14"
            ),
        ],
        revenue_chart=[
            {"month": "Jan", "revenue": 45000},
            {"month": "Feb", "revenue": 52000},
            {"month": "Mar", "revenue": 48000},
            {"month": "Apr", "revenue": 61000},
            {"month": "May", "revenue": 55000},
            {"month": "Jun", "revenue": 67000},
        ]
    )

# === FINANCIALS ENDPOINTS ===
ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def validate_file(file: UploadFile) -> bool:
    if not file.filename:
        return False

    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False

    allowed_mimes = {
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    }

    if file.content_type not in allowed_mimes:
        return False

    return True

@app.post("/api/v1/financials/invoices/upload")
async def upload_invoice(file: UploadFile = File(...)):
    """Upload e processamento simulado de fatura"""

    if not validate_file(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de arquivo não suportado. Formatos aceitos: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Arquivo muito grande. Tamanho máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Simula processamento de IA
    mock_extracted_data = {
        "supplier": {
            "name": "Empresa Fornecedora LTDA",
            "document": "12.345.678/0001-90",
            "address": "Rua das Empresas, 123"
        },
        "invoice": {
            "number": "NF-2024-001",
            "date": "2024-01-15",
            "dueDate": "2024-02-15",
            "category": "Produtos"
        },
        "financial": {
            "totalValue": 1250.00,
            "netValue": 1062.50,
            "taxValue": 187.50
        },
        "items": [
            {
                "description": "Produto A",
                "quantity": 10,
                "unitPrice": 100.00,
                "total": 1000.00
            },
            {
                "description": "Produto B",
                "quantity": 5,
                "unitPrice": 50.00,
                "total": 250.00
            }
        ]
    }

    response_data = {
        "success": True,
        "message": "Documento processado com sucesso",
        "id": "mock-file-id-123",
        "filename": file.filename,
        "extractedData": mock_extracted_data,
        "validationIssues": [],
        "processing_info": {
            "method": "mock_processing",
            "confidence_score": 0.95,
            "pages_processed": 1,
            "file_type": "pdf" if file.filename.lower().endswith('.pdf') else "image"
        },
        "file_info": {
            "filename": file.filename,
            "size": file.size,
            "content_type": file.content_type,
            "processed_at": datetime.now().isoformat()
        }
    }

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=response_data
    )

@app.post("/api/v1/financials/invoices")
async def save_invoice(invoice_data: dict):
    """Salva fatura validada (simulado)"""

    print(f"💾 Mock: Salvando fatura {invoice_data.get('invoiceNumber')} de {invoice_data.get('supplier')}")

    # Simula salvamento
    saved_invoice = {
        "id": "invoice-123",
        "invoiceNumber": invoice_data.get("invoiceNumber", "NF-2024-001"),
        "supplier": invoice_data.get("supplier", "Fornecedor"),
        "status": "validated",
        "totalValue": invoice_data.get("totalValue", 0)
    }

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "Fatura salva com sucesso",
            "data": saved_invoice
        }
    )

@app.get("/api/v1/financials/invoices")
async def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None
):
    """Lista faturas (mock)"""

    mock_invoices = [
        {
            "id": 1,
            "supplier": "Empresa A LTDA",
            "invoiceNumber": "NF-2024-001",
            "totalValue": 1250.00,
            "status": "validated",
            "date": "2024-01-15"
        },
        {
            "id": 2,
            "supplier": "Empresa B LTDA",
            "invoiceNumber": "NF-2024-002",
            "totalValue": 850.50,
            "status": "pending",
            "date": "2024-01-14"
        }
    ]

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "invoices": mock_invoices
        }
    )

@app.post("/api/v1/financials/test-data-cleaning")
async def test_data_cleaning(raw_data: Dict[str, Any]):
    """Teste de limpeza de dados (mock)"""

    # Simula limpeza
    cleaned_data = {
        "supplier_name": raw_data.get("supplier_name", "").title().strip(),
        "total_value": float(str(raw_data.get("total_value", 0)).replace(",", ".")),
        "cleaned_at": datetime.now().isoformat()
    }

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Limpeza de dados realizada com sucesso",
            "original_data": raw_data,
            "cleaned_data": cleaned_data,
            "cleaning_stats": {
                "fields_processed": len(raw_data),
                "fields_cleaned": 2,
                "confidence": 0.95
            }
        }
    )

# === SUPPLIERS ENDPOINTS ===
@app.post("/api/v1/suppliers/search")
async def search_suppliers(search_data: Dict[str, Any]):
    """Busca fornecedores (mock)"""

    supplier_name = search_data.get("supplier_name", "")
    limit = search_data.get("limit", 5)

    mock_matches = [
        {
            "id": 1,
            "name": "Empresa Fornecedora LTDA",
            "cnpj": "12.345.678/0001-90",
            "confidence_score": 0.95,
            "match_type": "exact"
        },
        {
            "id": 2,
            "name": "Empresa Fornecedora S.A.",
            "cnpj": "12.345.678/0001-91",
            "confidence_score": 0.85,
            "match_type": "fuzzy"
        }
    ]

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "message": "Busca realizada com sucesso",
            "results": {
                "matches": mock_matches[:limit],
                "total_found": len(mock_matches)
            }
        }
    )

@app.post("/api/v1/suppliers/create-or-merge")
async def create_or_merge_supplier(supplier_data: Dict[str, Any]):
    """Cria ou faz merge de fornecedor (mock)"""

    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "success": True,
            "message": "Fornecedor criado com sucesso",
            "supplier": {
                "id": 123,
                "name": supplier_data.get("name", "Novo Fornecedor"),
                "cnpj": supplier_data.get("cnpj", ""),
                "is_new": True
            }
        }
    )

@app.get("/api/v1/suppliers/list")
async def list_suppliers(
    skip: int = 0,
    limit: int = 50,
    active_only: bool = True,
    search: Optional[str] = None
):
    """Lista fornecedores (mock)"""

    mock_suppliers = [
        {"id": 1, "name": "Empresa A LTDA", "cnpj": "12.345.678/0001-90", "active": True},
        {"id": 2, "name": "Empresa B S.A.", "cnpj": "98.765.432/0001-10", "active": True},
        {"id": 3, "name": "Fornecedor C", "cnpj": "11.222.333/0001-44", "active": False}
    ]

    if active_only:
        mock_suppliers = [s for s in mock_suppliers if s["active"]]

    if search:
        mock_suppliers = [s for s in mock_suppliers if search.lower() in s["name"].lower()]

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "suppliers": mock_suppliers[skip:skip+limit],
            "pagination": {
                "total": len(mock_suppliers),
                "skip": skip,
                "limit": limit
            }
        }
    )

@app.get("/api/v1/suppliers/statistics")
async def get_supplier_statistics():
    """Estatísticas de fornecedores (mock)"""

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "statistics": {
                "total_suppliers": 45,
                "active_suppliers": 42,
                "inactive_suppliers": 3,
                "duplicates_detected": 2,
                "avg_confidence_score": 0.92
            }
        }
    )

@app.get("/api/v1/suppliers/{supplier_id}")
async def get_supplier(supplier_id: int):
    """Detalhes de fornecedor (mock)"""

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "success": True,
            "supplier": {
                "id": supplier_id,
                "name": f"Fornecedor {supplier_id}",
                "cnpj": "12.345.678/0001-90",
                "active": True,
                "created_at": "2024-01-01T00:00:00",
                "invoices_count": 15,
                "total_value": 25000.00
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)