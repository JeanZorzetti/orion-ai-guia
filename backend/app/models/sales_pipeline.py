"""
Modelos de Funil de Vendas (Sales Pipeline)

Inclui: Pipeline, Estágios e Oportunidades
Fase: 2 - Sprint Backend Sales
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.models import Base
import enum


# ============================================
# ENUMS
# ============================================

class OpportunityStatus(str, enum.Enum):
    """Status da oportunidade"""
    OPEN = "open"  # Aberta
    WON = "won"  # Ganha
    LOST = "lost"  # Perdida


class OpportunitySource(str, enum.Enum):
    """Origem da oportunidade"""
    WEBSITE = "website"
    PHONE = "phone"
    EMAIL = "email"
    REFERRAL = "referral"
    MARKETPLACE = "marketplace"
    SOCIAL_MEDIA = "social_media"
    EVENT = "event"
    OTHER = "other"


class OpportunityPriority(str, enum.Enum):
    """Prioridade da oportunidade"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ============================================
# MODELS
# ============================================

class SalesPipeline(Base):
    """
    Modelo de Pipeline de Vendas

    Define o funil de vendas com suas etapas e configurações.
    """
    __tablename__ = "sales_pipelines"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações Básicas
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Configurações
    is_default = Column(Boolean, default=False, nullable=False)  # Pipeline padrão
    is_active = Column(Boolean, default=True, nullable=False, index=True)

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace", back_populates="sales_pipelines")
    stages = relationship("PipelineStage", back_populates="pipeline", cascade="all, delete-orphan", order_by="PipelineStage.order")
    opportunities = relationship("Opportunity", back_populates="pipeline", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<SalesPipeline(id={self.id}, name='{self.name}')>"


class PipelineStage(Base):
    """
    Modelo de Estágio do Pipeline

    Representa cada etapa do funil de vendas.
    """
    __tablename__ = "pipeline_stages"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    pipeline_id = Column(Integer, ForeignKey("sales_pipelines.id", ondelete="CASCADE"), nullable=False, index=True)

    # Informações Básicas
    name = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False)  # Ordem no pipeline
    color = Column(String(7), nullable=True)  # Cor em hexadecimal (#RRGGBB)

    # Probabilidade e SLA
    win_probability = Column(Integer, nullable=False, default=0)  # Probabilidade de ganho (0-100%)
    max_days_in_stage = Column(Integer, nullable=True)  # Tempo máximo nesta etapa
    alert_before_sla = Column(Integer, nullable=True)  # Alertar X dias antes do SLA

    # Ações Automáticas (JSON)
    auto_actions = Column(JSON, nullable=True)  # {'create_task': 'Task name', 'send_email': 'template_id', 'notify_users': ['user1', 'user2']}

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    pipeline = relationship("SalesPipeline", back_populates="stages")
    opportunities = relationship("Opportunity", back_populates="stage")

    def __repr__(self):
        return f"<PipelineStage(id={self.id}, name='{self.name}', order={self.order})>"


class Opportunity(Base):
    """
    Modelo de Oportunidade de Venda

    Representa uma oportunidade no funil de vendas.
    """
    __tablename__ = "opportunities"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Multi-tenant (OBRIGATÓRIO)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)

    # Foreign Keys
    pipeline_id = Column(Integer, ForeignKey("sales_pipelines.id", ondelete="CASCADE"), nullable=False, index=True)
    stage_id = Column(Integer, ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=True, index=True)
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Informações Básicas
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    value = Column(Float, nullable=False, default=0.0)

    # Status e Origem
    status = Column(SQLEnum(OpportunityStatus), nullable=False, default=OpportunityStatus.OPEN, index=True)
    source = Column(SQLEnum(OpportunitySource), nullable=True)
    priority = Column(SQLEnum(OpportunityPriority), nullable=False, default=OpportunityPriority.MEDIUM)

    # Datas Importantes
    expected_close_date = Column(Date, nullable=True)
    closed_date = Column(Date, nullable=True)
    won_date = Column(Date, nullable=True)
    lost_date = Column(Date, nullable=True)

    # Informações de Fechamento
    lost_reason = Column(Text, nullable=True)
    won_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Contato
    contact_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    company_name = Column(String(255), nullable=True)

    # Campos Customizados
    custom_fields = Column(JSON, nullable=True)

    # Tracking
    stage_entered_at = Column(DateTime, nullable=True)  # Quando entrou no estágio atual
    days_in_stage = Column(Integer, nullable=True)  # Dias no estágio atual
    sla_overdue = Column(Boolean, default=False, nullable=False)  # Ultrapassou SLA

    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workspace = relationship("Workspace")
    pipeline = relationship("SalesPipeline", back_populates="opportunities")
    stage = relationship("PipelineStage", back_populates="opportunities")
    customer = relationship("Customer")
    assigned_user = relationship("User", foreign_keys=[assigned_to])
    won_user = relationship("User", foreign_keys=[won_by])

    def __repr__(self):
        return f"<Opportunity(id={self.id}, title='{self.title}', value={self.value}, status='{self.status}')>"
