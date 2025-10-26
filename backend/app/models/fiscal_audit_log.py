from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class FiscalAuditLog(Base):
    """
    FiscalAuditLog model - Log de auditoria para operações fiscais.
    Registra todas as tentativas de emissão, cancelamento e erros de NF-e.

    Compliance: Logs devem ser mantidos por 5 anos (exigência SEFAZ).
    """
    __tablename__ = "fiscal_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Tipo de ação fiscal
    action = Column(String(50), nullable=False, index=True)  # 'issue_attempt', 'issue_success', 'issue_failure', 'cancel', 'cancel_failure'

    # Dados da requisição e resposta (JSON)
    request_payload = Column(JSON, nullable=True)  # JSON enviado para a API fiscal
    response_payload = Column(JSON, nullable=True)  # JSON recebido da API fiscal

    # Informações de erro
    error_message = Column(Text, nullable=True)
    error_code = Column(String(20), nullable=True)

    # Rastreamento
    ip_address = Column(String(45), nullable=True)  # Suporta IPv4 e IPv6
    user_agent = Column(String(500), nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    workspace = relationship("Workspace")
    sale = relationship("Sale")
    user = relationship("User")

    def __repr__(self):
        return f"<FiscalAuditLog(id={self.id}, action='{self.action}', sale_id={self.sale_id})>"
