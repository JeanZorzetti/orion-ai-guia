"""
Models package - Database models for Orion ERP.
All models follow multi-tenant architecture with workspace_id.
"""

from app.core.database import Base
from app.models.workspace import Workspace
from app.models.user import User
from app.models.supplier_model import Supplier
from app.models.invoice_model import Invoice
from app.models.product import Product
from app.models.sale import Sale
from app.models.accounts_receivable import AccountsReceivable
from app.models.cash_flow import BankAccount, CashFlowTransaction
from app.models.batch import ProductBatch, BatchMovement
from app.models.warehouse import Warehouse, WarehouseArea, StockTransfer
from app.models.automation import (
    StockOptimization,
    PurchaseSuggestion,
    StockAlert,
    AlertRule
)

__all__ = [
    "Base",
    "Workspace",
    "User",
    "Supplier",
    "Invoice",
    "Product",
    "Sale",
    "AccountsReceivable",
    "BankAccount",
    "CashFlowTransaction",
    "ProductBatch",
    "BatchMovement",
    "Warehouse",
    "WarehouseArea",
    "StockTransfer",
    "StockOptimization",
    "PurchaseSuggestion",
    "StockAlert",
    "AlertRule",
]
