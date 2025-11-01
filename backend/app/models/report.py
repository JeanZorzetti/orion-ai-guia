"""
Models para Sistema de Relatórios

Gerenciamento de relatórios financeiros, histórico e agendamentos.

Responsável: Jean Zorzetti + Claude
Data: 2025-11-01
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Date,
    Text,
    ForeignKey,
    Enum as SQLEnum,
    JSON
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.base_class import Base


# ============================================
# ENUMS
# ============================================

class ReportTipo(str, enum.Enum):
    """Tipos de relatório"""
    FINANCEIRO = "financeiro"
    ESTOQUE = "estoque"
    VENDAS = "vendas"
    CUSTOMIZADO = "customizado"


class ReportStatus(str, enum.Enum):
    """Status de geração do relatório"""
    GERANDO = "gerando"
    CONCLUIDO = "concluido"
    ERRO = "erro"


class ReportFormato(str, enum.Enum):
    """Formatos de exportação"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class FrequenciaTipo(str, enum.Enum):
    """Tipos de frequência de agendamento"""
    DIARIO = "diario"
    SEMANAL = "semanal"
    QUINZENAL = "quinzenal"
    MENSAL = "mensal"
    TRIMESTRAL = "trimestral"
    ANUAL = "anual"
    PERSONALIZADO = "personalizado"


class ExecutionStatus(str, enum.Enum):
    """Status de execução de agendamento"""
    PENDENTE = "pendente"
    EXECUTANDO = "executando"
    SUCESSO = "sucesso"
    ERRO = "erro"


# ============================================
# MODELS
# ============================================

class GeneratedReport(Base):
    """
    Relatório gerado pelo sistema

    Armazena metadados e referência para arquivo de cada relatório gerado
    """
    __tablename__ = "generated_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False, index=True)
    tipo = Column(SQLEnum(ReportTipo), nullable=False, index=True)
    subtipo = Column(String(100), nullable=False, index=True)  # dre, fluxo-caixa, contas-pagar, etc
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.GERANDO, index=True)
    formato = Column(SQLEnum(ReportFormato), nullable=False)

    # Período do relatório
    periodo_inicio = Column(Date, nullable=False, index=True)
    periodo_fim = Column(Date, nullable=False, index=True)

    # Arquivo
    arquivo_url = Column(String(500), nullable=True)  # URL no S3 ou path local
    arquivo_tamanho = Column(Integer, nullable=True)  # bytes

    # Metadados
    gerado_por_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    gerado_em = Column(DateTime, default=datetime.utcnow, index=True)
    tags = Column(ARRAY(String), default=list)  # tags para filtrar/buscar
    config = Column(JSON, nullable=False)  # configurações usadas na geração
    erro_mensagem = Column(Text, nullable=True)  # se status == ERRO

    # Relationships
    gerado_por = relationship("User", foreign_keys=[gerado_por_id])

    def __repr__(self):
        return f"<GeneratedReport(id={self.id}, nome='{self.nome}', status={self.status})>"


class ReportSchedule(Base):
    """
    Agendamento de relatório automático

    Define quando e como um relatório deve ser gerado automaticamente
    """
    __tablename__ = "report_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome = Column(String(255), nullable=False, index=True)
    ativo = Column(Boolean, default=True, index=True)

    # Configuração do relatório a ser gerado
    report_config = Column(JSON, nullable=False)  # mesma estrutura de config do GeneratedReport

    # Frequência
    frequencia_tipo = Column(SQLEnum(FrequenciaTipo), nullable=False)
    frequencia_config = Column(JSON, nullable=True)  # { dia_semana: 1, hora: 9, minuto: 0 } etc

    # Controle de execução
    proxima_execucao = Column(DateTime, nullable=False, index=True)
    ultima_execucao = Column(DateTime, nullable=True)

    # Destinatários
    destinatarios_emails = Column(ARRAY(String), default=list)
    destinatarios_incluir_anexo = Column(Boolean, default=True)

    # Metadados
    criado_por_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    criado_em = Column(DateTime, default=datetime.utcnow)
    atualizado_em = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    criado_por = relationship("User", foreign_keys=[criado_por_id])
    execucoes = relationship("ScheduleExecution", back_populates="schedule", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReportSchedule(id={self.id}, nome='{self.nome}', ativo={self.ativo})>"


class ScheduleExecution(Base):
    """
    Registro de execução de um agendamento

    Histórico de todas as vezes que um agendamento foi executado
    """
    __tablename__ = "schedule_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(UUID(as_uuid=True), ForeignKey("report_schedules.id"), nullable=False, index=True)

    # Status da execução
    status = Column(SQLEnum(ExecutionStatus), default=ExecutionStatus.PENDENTE, index=True)

    # Timestamps
    iniciado_em = Column(DateTime, default=datetime.utcnow, index=True)
    finalizado_em = Column(DateTime, nullable=True)

    # Resultado
    report_id = Column(UUID(as_uuid=True), ForeignKey("generated_reports.id"), nullable=True)
    erro_mensagem = Column(Text, nullable=True)

    # Relationships
    schedule = relationship("ReportSchedule", back_populates="execucoes")
    report = relationship("GeneratedReport")

    def __repr__(self):
        return f"<ScheduleExecution(id={self.id}, schedule_id={self.schedule_id}, status={self.status})>"
