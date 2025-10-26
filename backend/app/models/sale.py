from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Sale(Base):
    """
    Sale model - Vendas realizadas.
    Isolado por workspace (multi-tenant).
    """
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)

    # Sale details
    customer_name = Column(String, nullable=False)
    customer_cpf_cnpj = Column(String(14), nullable=True)  # CPF (11) ou CNPJ (14) - essencial para NF-e
    customer_email = Column(String(255), nullable=True)
    customer_phone = Column(String(20), nullable=True)

    # Endereço do Cliente (essencial para NF-e)
    customer_cep = Column(String(8), nullable=True)
    customer_logradouro = Column(String(255), nullable=True)
    customer_numero = Column(String(20), nullable=True)
    customer_complemento = Column(String(100), nullable=True)
    customer_bairro = Column(String(100), nullable=True)
    customer_cidade = Column(String(100), nullable=True)
    customer_uf = Column(String(2), nullable=True)
    customer_codigo_municipio = Column(String(7), nullable=True)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)

    # Status and dates
    status = Column(String, default="pending", nullable=False)  # pending, completed, cancelled
    sale_date = Column(Date, default=datetime.utcnow, nullable=False)

    # Rastreamento da NF-e
    nfe_status = Column(String(20), default='pending')  # 'pending', 'processing', 'issued', 'rejected', 'cancelled'
    nfe_id_partner = Column(String(100), nullable=True)  # ID da nota no sistema parceiro (PlugNotas/FocusNFe)
    nfe_chave = Column(String(44), nullable=True)  # Chave de acesso da NF-e (44 dígitos)
    nfe_numero = Column(Integer, nullable=True)  # Número da NF-e
    nfe_serie = Column(Integer, nullable=True)  # Série da NF-e
    nfe_xml_url = Column(String(500), nullable=True)  # URL do XML da NF-e
    nfe_danfe_url = Column(String(500), nullable=True)  # URL do DANFE (PDF)
    nfe_protocolo = Column(String(50), nullable=True)  # Protocolo de autorização SEFAZ
    nfe_issued_at = Column(DateTime, nullable=True)  # Data/hora da emissão

    # Erros de emissão
    nfe_rejection_reason = Column(Text, nullable=True)  # Motivo da rejeição pela SEFAZ
    nfe_rejection_code = Column(String(10), nullable=True)  # Código do erro SEFAZ

    # Cancelamento
    nfe_cancelled_at = Column(DateTime, nullable=True)
    nfe_cancellation_reason = Column(Text, nullable=True)

    # Natureza da Operação Fiscal
    natureza_operacao = Column(String(100), default='Venda de mercadoria')
    cfop = Column(String(4), default='5102')  # 5102=Venda dentro do estado, 6102=Venda fora do estado

    # Origem (integração com e-commerce)
    origin_channel = Column(String(50), nullable=True)  # 'manual', 'shopify', 'mercadolivre', etc.
    origin_order_id = Column(String(100), nullable=True)  # ID do pedido no canal de origem

    # Additional info
    notes = Column(Text, nullable=True)  # Campo para observações/notas

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="sales")
    product = relationship("Product", back_populates="sales")

    def __repr__(self):
        return f"<Sale(id={self.id}, customer='{self.customer_name}', workspace_id={self.workspace_id})>"
