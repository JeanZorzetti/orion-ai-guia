-- Migration 015: Tabelas de Sistema de Relatórios
-- Data: 2025-11-01
-- Responsável: Jean Zorzetti + Claude
-- Descrição: Criar tabelas para geração, histórico e agendamento de relatórios

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE report_tipo AS ENUM ('financeiro', 'estoque', 'vendas', 'customizado');
CREATE TYPE report_status AS ENUM ('gerando', 'concluido', 'erro');
CREATE TYPE report_formato AS ENUM ('pdf', 'excel', 'csv', 'json');
CREATE TYPE frequencia_tipo AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal', 'trimestral', 'anual', 'personalizado');
CREATE TYPE execution_status AS ENUM ('pendente', 'executando', 'sucesso', 'erro');

-- ============================================
-- TABELA: generated_reports
-- ============================================

CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    tipo report_tipo NOT NULL,
    subtipo VARCHAR(100) NOT NULL,
    status report_status DEFAULT 'gerando' NOT NULL,
    formato report_formato NOT NULL,

    -- Período do relatório
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,

    -- Arquivo
    arquivo_url VARCHAR(500),
    arquivo_tamanho INTEGER,  -- bytes

    -- Metadados
    gerado_por_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gerado_em TIMESTAMP DEFAULT NOW(),
    tags TEXT[],
    config JSONB NOT NULL,
    erro_mensagem TEXT,

    -- Indexes
    CONSTRAINT chk_periodo CHECK (periodo_fim >= periodo_inicio)
);

CREATE INDEX idx_generated_reports_nome ON generated_reports(nome);
CREATE INDEX idx_generated_reports_tipo ON generated_reports(tipo);
CREATE INDEX idx_generated_reports_subtipo ON generated_reports(subtipo);
CREATE INDEX idx_generated_reports_status ON generated_reports(status);
CREATE INDEX idx_generated_reports_periodo_inicio ON generated_reports(periodo_inicio);
CREATE INDEX idx_generated_reports_periodo_fim ON generated_reports(periodo_fim);
CREATE INDEX idx_generated_reports_gerado_em ON generated_reports(gerado_em DESC);
CREATE INDEX idx_generated_reports_gerado_por_id ON generated_reports(gerado_por_id);

COMMENT ON TABLE generated_reports IS 'Histórico de relatórios gerados pelo sistema';
COMMENT ON COLUMN generated_reports.config IS 'Configurações JSON usadas na geração do relatório';
COMMENT ON COLUMN generated_reports.tags IS 'Tags para filtrar e buscar relatórios';

-- ============================================
-- TABELA: report_schedules
-- ============================================

CREATE TABLE report_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL,

    -- Configuração do relatório
    report_config JSONB NOT NULL,

    -- Frequência
    frequencia_tipo frequencia_tipo NOT NULL,
    frequencia_config JSONB,  -- { dia_semana, dia_mes, hora, minuto, cron_expression }

    -- Controle de execução
    proxima_execucao TIMESTAMP NOT NULL,
    ultima_execucao TIMESTAMP,

    -- Destinatários
    destinatarios_emails TEXT[],
    destinatarios_incluir_anexo BOOLEAN DEFAULT TRUE,

    -- Metadados
    criado_por_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_schedules_nome ON report_schedules(nome);
CREATE INDEX idx_report_schedules_ativo ON report_schedules(ativo);
CREATE INDEX idx_report_schedules_proxima_execucao ON report_schedules(proxima_execucao);
CREATE INDEX idx_report_schedules_criado_por_id ON report_schedules(criado_por_id);

COMMENT ON TABLE report_schedules IS 'Agendamentos de relatórios automáticos';
COMMENT ON COLUMN report_schedules.report_config IS 'Configuração completa do relatório a ser gerado';
COMMENT ON COLUMN report_schedules.frequencia_config IS 'Configuração detalhada da frequência de execução';

-- ============================================
-- TABELA: schedule_executions
-- ============================================

CREATE TABLE schedule_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES report_schedules(id) ON DELETE CASCADE,

    -- Status
    status execution_status DEFAULT 'pendente' NOT NULL,

    -- Timestamps
    iniciado_em TIMESTAMP DEFAULT NOW(),
    finalizado_em TIMESTAMP,

    -- Resultado
    report_id UUID REFERENCES generated_reports(id) ON DELETE SET NULL,
    erro_mensagem TEXT
);

CREATE INDEX idx_schedule_executions_schedule_id ON schedule_executions(schedule_id);
CREATE INDEX idx_schedule_executions_status ON schedule_executions(status);
CREATE INDEX idx_schedule_executions_iniciado_em ON schedule_executions(iniciado_em DESC);

COMMENT ON TABLE schedule_executions IS 'Histórico de execuções de agendamentos';

-- ============================================
-- TRIGGER: atualizar_data_atualizacao
-- ============================================

CREATE OR REPLACE FUNCTION update_report_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_report_schedule_timestamp
BEFORE UPDATE ON report_schedules
FOR EACH ROW
EXECUTE FUNCTION update_report_schedule_timestamp();

-- ============================================
-- DADOS INICIAIS (opcional)
-- ============================================

-- Nenhum dado inicial necessário

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Verificar se as tabelas foram criadas
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE tablename IN ('generated_reports', 'report_schedules', 'schedule_executions');

-- Verificar se os enums foram criados
SELECT
    typname
FROM pg_type
WHERE typname IN ('report_tipo', 'report_status', 'report_formato', 'frequencia_tipo', 'execution_status');

-- Contar registros (deve ser 0 para todas)
SELECT 'generated_reports' as tabela, COUNT(*) as registros FROM generated_reports
UNION ALL
SELECT 'report_schedules', COUNT(*) FROM report_schedules
UNION ALL
SELECT 'schedule_executions', COUNT(*) FROM schedule_executions;
