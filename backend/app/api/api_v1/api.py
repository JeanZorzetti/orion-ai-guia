from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, dashboard, financials

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(financials.router, prefix="/financials", tags=["financials"])