from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Workspace(Base):
    """
    Workspace model - Central para multi-tenancy.
    Cada workspace representa uma empresa/organização isolada.
    """
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Dados Fiscais da Empresa
    cnpj = Column(String(14), nullable=True)
    razao_social = Column(String(255), nullable=True)
    nome_fantasia = Column(String(255), nullable=True)
    inscricao_estadual = Column(String(20), nullable=True)
    inscricao_municipal = Column(String(20), nullable=True)
    regime_tributario = Column(Integer, nullable=True)  # 1=Simples Nacional, 2=SN-Excesso, 3=Normal

    # Endereço Fiscal
    fiscal_cep = Column(String(8), nullable=True)
    fiscal_logradouro = Column(String(255), nullable=True)
    fiscal_numero = Column(String(20), nullable=True)
    fiscal_complemento = Column(String(100), nullable=True)
    fiscal_bairro = Column(String(100), nullable=True)
    fiscal_cidade = Column(String(100), nullable=True)
    fiscal_uf = Column(String(2), nullable=True)
    fiscal_codigo_municipio = Column(String(7), nullable=True)

    # Credenciais API Fiscal (criptografadas)
    fiscal_partner = Column(String(50), nullable=True)  # 'plugnotas', 'focusnfe', etc.
    fiscal_partner_api_key = Column(String(500), nullable=True)  # ENCRYPTED
    fiscal_partner_webhook_token = Column(String(100), nullable=True)

    # Certificado Digital (A1 - armazenado no parceiro)
    certificate_uploaded_at = Column(DateTime, nullable=True)
    certificate_expires_at = Column(DateTime, nullable=True)
    certificate_status = Column(String(20), default='not_uploaded')  # 'active', 'expired', 'not_uploaded'

    # Configurações de Notas
    nfe_serie = Column(Integer, default=1)
    nfe_next_number = Column(Integer, default=1)
    nfe_ambiente = Column(Integer, default=2)  # 1=Produção, 2=Homologação

    # Metadata de Configuração Fiscal
    fiscal_config_updated_at = Column(DateTime, nullable=True)
    fiscal_config_updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)

    # Integração Shopify
    integration_shopify_store_url = Column(String(255), nullable=True)
    integration_shopify_api_key = Column(String(500), nullable=True)  # ENCRYPTED
    integration_shopify_last_sync = Column(DateTime, nullable=True)

    # Integração Mercado Livre
    integration_mercadolivre_access_token = Column(String(500), nullable=True)  # ENCRYPTED
    integration_mercadolivre_refresh_token = Column(String(500), nullable=True)  # ENCRYPTED
    integration_mercadolivre_user_id = Column(String(50), nullable=True)
    integration_mercadolivre_last_sync = Column(DateTime, nullable=True)
    integration_mercadolivre_token_expires_at = Column(DateTime, nullable=True)

    # Integração WooCommerce
    integration_woocommerce_store_url = Column(String(255), nullable=True)
    integration_woocommerce_consumer_key = Column(String(500), nullable=True)  # ENCRYPTED
    integration_woocommerce_consumer_secret = Column(String(500), nullable=True)  # ENCRYPTED
    integration_woocommerce_last_sync = Column(DateTime, nullable=True)

    # Integração Magazine Luiza (Magalu)
    integration_magalu_seller_id = Column(String(100), nullable=True)
    integration_magalu_api_key = Column(String(500), nullable=True)  # ENCRYPTED
    integration_magalu_last_sync = Column(DateTime, nullable=True)

    # Integração TikTok Shop
    integration_tiktokshop_access_token = Column(String(500), nullable=True)  # ENCRYPTED
    integration_tiktokshop_refresh_token = Column(String(500), nullable=True)  # ENCRYPTED
    integration_tiktokshop_shop_id = Column(String(100), nullable=True)
    integration_tiktokshop_token_expires_at = Column(DateTime, nullable=True)
    integration_tiktokshop_last_sync = Column(DateTime, nullable=True)

    # Relationships
    users = relationship(
        "User",
        back_populates="workspace",
        foreign_keys="[User.workspace_id]",
        cascade="all, delete-orphan"
    )
    fiscal_config_updated_by_user = relationship(
        "User",
        foreign_keys=[fiscal_config_updated_by],
        uselist=False
    )
    suppliers = relationship("Supplier", back_populates="workspace", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="workspace", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="workspace", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="workspace", cascade="all, delete-orphan")
    accounts_receivable = relationship("AccountsReceivable", back_populates="workspace", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="workspace", cascade="all, delete-orphan")
    cash_flow_transactions = relationship("CashFlowTransaction", back_populates="workspace", cascade="all, delete-orphan")
    product_batches = relationship("ProductBatch", back_populates="workspace", cascade="all, delete-orphan")
    stock_adjustments = relationship("StockAdjustment", back_populates="workspace", cascade="all, delete-orphan")
    sales_pipelines = relationship("SalesPipeline", back_populates="workspace", cascade="all, delete-orphan")
    marketplace_integrations = relationship("MarketplaceIntegration", back_populates="workspace", cascade="all, delete-orphan")
    unified_orders = relationship("UnifiedOrder", back_populates="workspace", cascade="all, delete-orphan")
    sync_jobs = relationship("SyncJob", back_populates="workspace", cascade="all, delete-orphan")
    box_types = relationship("BoxType", back_populates="workspace", cascade="all, delete-orphan")
    picking_lists = relationship("PickingList", back_populates="workspace", cascade="all, delete-orphan")
    packing_stations = relationship("PackingStation", back_populates="workspace", cascade="all, delete-orphan")
    packing_jobs = relationship("PackingJob", back_populates="workspace", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="workspace", cascade="all, delete-orphan")
    delivery_routes = relationship("DeliveryRoute", back_populates="workspace", cascade="all, delete-orphan")
    deliveries = relationship("Delivery", back_populates="workspace", cascade="all, delete-orphan")

    # Analytics relationships
    kpi_definitions = relationship("KPIDefinition", back_populates="workspace", cascade="all, delete-orphan")
    kpi_values = relationship("KPIValue", back_populates="workspace", cascade="all, delete-orphan")
    dashboard_alerts = relationship("DashboardAlert", back_populates="workspace", cascade="all, delete-orphan")
    recommended_actions = relationship("RecommendedAction", back_populates="workspace", cascade="all, delete-orphan")
    custom_reports = relationship("CustomReport", back_populates="workspace", cascade="all, delete-orphan")
    report_executions = relationship("ReportExecution", back_populates="workspace", cascade="all, delete-orphan")

    # Inventory relationships
    inventory_cycle_counts = relationship("InventoryCycleCount", back_populates="workspace", cascade="all, delete-orphan")

    # Notification relationships
    notifications = relationship("Notification", back_populates="workspace", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Workspace(id={self.id}, name='{self.name}', slug='{self.slug}')>"
