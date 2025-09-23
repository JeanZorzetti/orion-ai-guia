from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter()

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

@router.get("/", response_model=DashboardData)
async def get_dashboard_data():
    # TODO: Implement actual database queries
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