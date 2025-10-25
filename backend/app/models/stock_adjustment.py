from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class StockAdjustment(Base):
    """
    StockAdjustment model - Histórico de ajustes de estoque.
    Registra todas as entradas, saídas e correções de estoque.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "stock_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Quem fez o ajuste

    # Adjustment details
    adjustment_type = Column(String, nullable=False)  # 'in', 'out', 'correction'
    quantity = Column(Integer, nullable=False)  # Quantidade ajustada
    previous_quantity = Column(Integer, nullable=False)  # Estoque antes do ajuste
    new_quantity = Column(Integer, nullable=False)  # Estoque após o ajuste
    reason = Column(Text, nullable=False)  # Motivo do ajuste

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace")
    product = relationship("Product")
    user = relationship("User")

    def __repr__(self):
        return f"<StockAdjustment(id={self.id}, type='{self.adjustment_type}', product_id={self.product_id})>"
