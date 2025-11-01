"""
Schemas Pydantic para Sistema de Relatórios

Validação de entrada/saída para endpoints de relatórios.

Responsável: Jean Zorzetti + Claude
Data: 2025-11-01
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, date
from enum import Enum
from uuid import UUID


# ============================================
# ENUMS
# ============================================

class ReportTipo(str, Enum):
    """Tipos de relatório"""
    FINANCEIRO = "financeiro"
    ESTOQUE = "estoque"
    VENDAS = "vendas"
    CUSTOMIZADO = "customizado"


class ReportStatus(str, Enum):
    """Status de geração"""
    GERANDO = "gerando"
    CONCLUIDO = "concluido"
    ERRO = "erro"


class ReportFormato(str, Enum):
    """Formatos de exportação"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class FrequenciaTipo(str, Enum):
    """Tipos de frequência"""
    DIARIO = "diario"
    SEMANAL = "semanal"
    QUINZENAL = "quinzenal"
    MENSAL = "mensal"
    TRIMESTRAL = "trimestral"
    ANUAL = "anual"
    PERSONALIZADO = "personalizado"


class ExecutionStatus(str, Enum):
    """Status de execução"""
    PENDENTE = "pendente"
    EXECUTANDO = "executando"
    SUCESSO = "sucesso"
    ERRO = "erro"


# ============================================
# EXECUTIVE DASHBOARD SCHEMAS
# ============================================

class ExecutiveDashboardKPI(BaseModel):
    """KPI individual do dashboard executivo"""
    id: str
    titulo: str
    valor: float
    valorFormatado: str
    variacao: float  # percentual
    variacaoAbsoluta: float
    tendencia: Literal['up', 'down', 'stable']
    categoria: str
    cor: str
    meta: Optional[float] = None
    percentualMeta: Optional[float] = None


class ExecutiveDashboardKPIsResponse(BaseModel):
    """Response com todos os KPIs do dashboard"""
    kpis: List[ExecutiveDashboardKPI]
    periodo_inicio: date
    periodo_fim: date
    periodo_comparacao_inicio: date
    periodo_comparacao_fim: date


class ChartDataset(BaseModel):
    """Dataset de um gráfico"""
    label: str
    data: List[float]
    backgroundColor: str | List[str]
    borderColor: Optional[str] = None


class ChartData(BaseModel):
    """Dados de um gráfico"""
    labels: List[str]
    datasets: List[ChartDataset]


class ChartConfig(BaseModel):
    """Configuração de visualização do gráfico"""
    showLegend: bool = True
    showGrid: bool = True
    showTooltip: bool = True
    enableDrillDown: bool = False


class ExecutiveDashboardChart(BaseModel):
    """Gráfico do dashboard executivo"""
    id: str
    titulo: str
    tipo: Literal['linha', 'linhaMultipla', 'barra', 'barraEmpilhada', 'area', 'pizza']
    dados: ChartData
    config: ChartConfig


class ExecutiveDashboardChartsResponse(BaseModel):
    """Response com todos os gráficos do dashboard"""
    graficos: List[ExecutiveDashboardChart]


class ComparisonMetric(BaseModel):
    """Métrica comparativa"""
    metrica: str
    valorAtual: float
    valorAnterior: float
    diferenca: float
    diferencaPercentual: float
    tendencia: Literal['up', 'down', 'stable']


class Insight(BaseModel):
    """Insight gerado automaticamente"""
    id: str
    tipo: Literal['positivo', 'negativo', 'alerta', 'neutro']
    titulo: str
    descricao: str
    icone: Optional[str] = None


class ExecutiveDashboardInsightsResponse(BaseModel):
    """Response com insights e análise comparativa"""
    comparacao: Dict[str, Any]  # { periodo, periodoAnterior, metricas: List[ComparisonMetric] }
    insights: List[Insight]


# ============================================
# GENERATED REPORTS SCHEMAS
# ============================================

class GenerateReportRequest(BaseModel):
    """Request para gerar um relatório"""
    nome: str = Field(..., min_length=3, max_length=255)
    tipo: ReportTipo
    subtipo: str = Field(..., min_length=1, max_length=100)  # dre, fluxo-caixa, etc
    formato: ReportFormato
    periodo_inicio: date
    periodo_fim: date
    tags: List[str] = Field(default_factory=list)
    config: Dict[str, Any] = Field(default_factory=dict)  # configurações específicas do relatório

    @validator('periodo_fim')
    def validate_period(cls, v, values):
        if 'periodo_inicio' in values and v < values['periodo_inicio']:
            raise ValueError('periodo_fim deve ser maior ou igual a periodo_inicio')
        return v


class UserInfo(BaseModel):
    """Informações básicas do usuário"""
    id: UUID
    nome: str
    email: str


class GeneratedReportResponse(BaseModel):
    """Response de um relatório gerado"""
    id: UUID
    nome: str
    tipo: ReportTipo
    subtipo: str
    status: ReportStatus
    formato: ReportFormato
    periodo_inicio: date
    periodo_fim: date
    arquivo_url: Optional[str] = None
    arquivo_tamanho: Optional[int] = None
    gerado_por: UserInfo
    gerado_em: datetime
    tags: List[str]
    config: Dict[str, Any]
    erro_mensagem: Optional[str] = None

    class Config:
        from_attributes = True


class ReportStatsResponse(BaseModel):
    """Estatísticas de relatórios"""
    total: int
    concluidos: int
    gerando: int
    erros: int
    tamanhoTotal: int  # bytes


# ============================================
# REPORT SCHEDULES SCHEMAS
# ============================================

class FrequenciaConfig(BaseModel):
    """Configuração de frequência de agendamento"""
    dia_semana: Optional[int] = None  # 0-6 (segunda-domingo)
    dia_mes: Optional[int] = None  # 1-31
    hora: int = Field(0, ge=0, le=23)
    minuto: int = Field(0, ge=0, le=59)
    cron_expression: Optional[str] = None  # para personalizado


class CreateScheduleRequest(BaseModel):
    """Request para criar agendamento"""
    nome: str = Field(..., min_length=3, max_length=255)
    ativo: bool = True
    report_config: Dict[str, Any]  # mesma estrutura de GenerateReportRequest
    frequencia_tipo: FrequenciaTipo
    frequencia_config: FrequenciaConfig
    destinatarios_emails: List[str] = Field(default_factory=list)
    destinatarios_incluir_anexo: bool = True


class UpdateScheduleRequest(BaseModel):
    """Request para atualizar agendamento"""
    nome: Optional[str] = Field(None, min_length=3, max_length=255)
    ativo: Optional[bool] = None
    report_config: Optional[Dict[str, Any]] = None
    frequencia_tipo: Optional[FrequenciaTipo] = None
    frequencia_config: Optional[FrequenciaConfig] = None
    destinatarios_emails: Optional[List[str]] = None
    destinatarios_incluir_anexo: Optional[bool] = None


class ScheduleExecutionInfo(BaseModel):
    """Informações de uma execução de agendamento"""
    id: UUID
    status: ExecutionStatus
    iniciado_em: datetime
    finalizado_em: Optional[datetime] = None
    report_id: Optional[UUID] = None
    erro_mensagem: Optional[str] = None

    class Config:
        from_attributes = True


class ScheduleResponse(BaseModel):
    """Response de um agendamento"""
    id: UUID
    nome: str
    ativo: bool
    report_config: Dict[str, Any]
    frequencia_tipo: FrequenciaTipo
    frequencia_config: FrequenciaConfig
    proxima_execucao: datetime
    ultima_execucao: Optional[datetime] = None
    destinatarios_emails: List[str]
    destinatarios_incluir_anexo: bool
    criado_por: UserInfo
    criado_em: datetime
    atualizado_em: datetime
    execucoes: List[ScheduleExecutionInfo] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ScheduleStatsResponse(BaseModel):
    """Estatísticas de agendamentos"""
    total: int
    ativos: int
    inativos: int
    execucoesComSucesso: int
    execucoesComErro: int
