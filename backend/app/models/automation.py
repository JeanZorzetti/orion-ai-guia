"""
Modelos de Automação de Estoque

Inclui: Otimização, Sugestões de Compra, Alertas e Regras de Automação
Fase: 2 - Sprint Backend Inventory
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.models import Base
import enum


# ============================================
# ENUMS
# ============================================

class RecommendedAction(str, enum.Enum):
    """Ações recomendadas para otimização de estoque"""
    ORDER_NOW = "order_now"  # Pedir agora
    ORDER_SOON = "order_soon"  # Pedir em breve
    SUFFICIENT = "sufficient"  # Suficiente
    EXCESS = "excess"  # Excesso


class SuggestionPriority(str, enum.Enum):
    """Prioridade de sugestão de compra"""
    URGENT = "urgent"  # Urgente
    HIGH = "high"  # Alta
    MEDIUM = "medium"  # Média
    LOW = "low"  # Baixa


class SuggestionStatus(str, enum.Enum):
    """Status da sugestão de compra"""
    PENDING = "pending"  # Pendente
    APPROVED = "approved"  # Aprovada
    ORDERED = "ordered"  # Pedido realizado
    DISMISSED = "dismissed"  # Descartada


class AlertType(str, enum.Enum):
    """Tipos de alerta de estoque"""
    LOW_STOCK = "low_stock"  # Estoque baixo
    CRITICAL_STOCK = "critical_stock"  # Estoque crítico
    OVERSTOCK = "overstock"  # Excesso de estoque
    EXPIRING_SOON = "expiring_soon"  # Vencendo em breve
    EXPIRED = "expired"  # Vencido
    SLOW_MOVING = "slow_moving"  # Giro lento
    FAST_MOVING = "fast_moving"  # Giro rápido
    STOCKOUT_RISK = "stockout_risk"  # Risco de ruptura


class AlertSeverity(str, enum.Enum):
    """Severidade do alerta"""
    CRITICAL = "critical"  # Crítico
    HIGH = "high"  # Alto
    MEDIUM = "medium"  # Médio
    LOW = "low"  # Baixo


class AlertStatus(str, enum.Enum):
    """Status do alerta"""
    ACTIVE = "active"  # Ativo
    ACKNOWLEDGED = "acknowledged"  # Reconhecido
    RESOLVED = "resolved"  # Resolvido
    DISMISSED = "dismissed"  # Descartado


# ============================================
# MODELS
# ============================================

class StockOptimization(Base):
    """
    Modelo de Otimização de Estoque

    Calcula pontos de pedido, estoque de segurança e quantidades ótimas
    baseado em demanda histórica e lead time.
    """
    __tablename__ = "stock_optimizations"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Produto e Depósito
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)

    # Cálculos de Otimização
    reorder_point = Column(Integer, nullable=False)  # Ponto de pedido
    safety_stock = Column(Integer, nullable=False)  # Estoque de segurança
    optimal_order_quantity = Column(Integer, nullable=False)  # Quantidade ótima de pedido (EOQ)
    max_stock_level = Column(Integer, nullable=False)  # Nível máximo de estoque

    # Parâmetros de Demanda
    avg_daily_demand = Column(Float, nullable=False)  # Demanda média diária
    lead_time_days = Column(Integer, nullable=False)  # Tempo de entrega em dias
    service_level_target = Column(Float, nullable=False, default=95.0)  # Nível de serviço alvo (%)

    # Custos
    holding_cost_per_unit = Column(Float, nullable=True)  # Custo de manutenção por unidade
    ordering_cost = Column(Float, nullable=True)  # Custo de pedido
    stockout_cost_estimate = Column(Float, nullable=True)  # Custo estimado de ruptura

    # Situação Atual
    current_stock = Column(Integer, nullable=False)  # Estoque atual
    recommended_action = Column(SQLEnum(RecommendedAction), nullable=False, index=True)
    days_until_stockout = Column(Integer, nullable=True)  # Dias até ruptura
    suggested_order_date = Column(Date, nullable=True)  # Data sugerida para pedido

    # Metadata
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    product = relationship("Product")
    warehouse = relationship("Warehouse")

    def __repr__(self):
        return f"<StockOptimization(id={self.id}, product_id={self.product_id}, action='{self.recommended_action}')>"


class PurchaseSuggestion(Base):
    """
    Modelo de Sugestão de Compra

    Sugestões automáticas baseadas em previsão de demanda e níveis de estoque.
    """
    __tablename__ = "purchase_suggestions"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Produto
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    # Sugestão
    suggested_quantity = Column(Integer, nullable=False)
    estimated_cost = Column(Float, nullable=False)
    priority = Column(SQLEnum(SuggestionPriority), nullable=False, index=True)
    reason = Column(Text, nullable=False)

    # Previsão
    forecast_demand = Column(Integer, nullable=True)  # Demanda prevista
    current_stock = Column(Integer, nullable=False)
    lead_time_days = Column(Integer, nullable=False)

    # Fornecedor
    recommended_supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    alternative_suppliers = Column(JSON, nullable=True)  # Lista de fornecedores alternativos

    # Prazos
    order_by_date = Column(Date, nullable=False)  # Pedir até essa data
    expected_delivery_date = Column(Date, nullable=True)

    # Status
    status = Column(SQLEnum(SuggestionStatus), nullable=False, default=SuggestionStatus.PENDING, index=True)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    dismissed_reason = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    product = relationship("Product")
    supplier = relationship("Supplier")
    approver = relationship("User", foreign_keys=[approved_by])

    def __repr__(self):
        return f"<PurchaseSuggestion(id={self.id}, product_id={self.product_id}, priority='{self.priority}')>"


class StockAlert(Base):
    """
    Modelo de Alerta de Estoque

    Alertas inteligentes baseados em regras configuradas.
    """
    __tablename__ = "stock_alerts"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Tipo e Severidade
    type = Column(SQLEnum(AlertType), nullable=False, index=True)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)

    # Escopo
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id", ondelete="SET NULL"), nullable=True)
    batch_id = Column(Integer, ForeignKey("product_batches.id", ondelete="SET NULL"), nullable=True)

    # Alerta
    message = Column(Text, nullable=False)
    current_value = Column(Float, nullable=True)  # Valor atual que disparou o alerta
    threshold_value = Column(Float, nullable=True)  # Valor limite configurado
    recommended_action = Column(Text, nullable=False)

    # Notificações
    notify_users = Column(JSON, nullable=True)  # Lista de user_ids para notificar
    notification_channels = Column(JSON, nullable=True)  # ['email', 'sms', 'push']
    sent_at = Column(DateTime, nullable=True)

    # Status
    status = Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE, index=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    product = relationship("Product")
    warehouse = relationship("Warehouse")
    batch = relationship("ProductBatch")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])

    def __repr__(self):
        return f"<StockAlert(id={self.id}, type='{self.type}', severity='{self.severity}')>"


class AlertRule(Base):
    """
    Modelo de Regra de Alerta

    Define regras de automação para disparo de alertas.
    """
    __tablename__ = "alert_rules"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Regra
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(SQLEnum(AlertType), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Condições (JSON array de condições)
    # Ex: [{"metric": "quantity", "operator": "<", "threshold": 10}]
    conditions = Column(JSON, nullable=False)

    # Escopo
    applies_to = Column(String(50), nullable=False)  # 'all', 'category', 'products', 'warehouse'
    category_ids = Column(JSON, nullable=True)  # Lista de category_ids
    product_ids = Column(JSON, nullable=True)  # Lista de product_ids
    warehouse_ids = Column(JSON, nullable=True)  # Lista de warehouse_ids

    # Ações Automáticas
    auto_actions = Column(JSON, nullable=False)  # ['send_notification', 'create_purchase_suggestion', 'create_task']
    notification_template = Column(Text, nullable=True)
    notify_users = Column(JSON, nullable=True)  # Lista de user_ids
    notification_channels = Column(JSON, nullable=True)  # ['email', 'sms', 'push']

    # Frequência de Verificação
    check_frequency = Column(String(50), nullable=False)  # 'realtime', 'hourly', 'daily', 'weekly'
    last_checked_at = Column(DateTime, nullable=True)

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<AlertRule(id={self.id}, name='{self.name}', active={self.is_active})>"
