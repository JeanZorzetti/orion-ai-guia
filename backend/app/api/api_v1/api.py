from fastapi import APIRouter
from app.api.api_v1.endpoints import (
    auth,
    users,
    dashboard,
    financials,
    suppliers,
    invoices,
    products,
    sales,
    super_admin,
    admin_reset,
    fiscal,
    integrations,
    accounts_receivable,
    accounts_payable,
    cash_flow,
    cash_flow_analytics,
    reports,
    marketplace,
    sales_pipeline,
    logistics,
    analytics
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(financials.router, prefix="/financials", tags=["financials"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(accounts_receivable.router, prefix="/accounts-receivable", tags=["accounts-receivable"])
api_router.include_router(accounts_payable.router, prefix="/accounts-payable", tags=["accounts-payable"])
api_router.include_router(cash_flow.router, prefix="/cash-flow", tags=["cash-flow"])
api_router.include_router(cash_flow_analytics.router, prefix="/cash-flow", tags=["cash-flow-analytics"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(fiscal.router, prefix="/fiscal", tags=["fiscal"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
api_router.include_router(sales_pipeline.router, prefix="/sales-pipeline", tags=["sales-pipeline"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["logistics"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(super_admin.router, prefix="/super-admin", tags=["super-admin"])
api_router.include_router(admin_reset.router, prefix="/admin-utils", tags=["admin-utils"])