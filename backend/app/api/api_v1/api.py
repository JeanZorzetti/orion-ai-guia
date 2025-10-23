from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, dashboard, financials, suppliers, super_admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(financials.router, prefix="/financials", tags=["financials"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])