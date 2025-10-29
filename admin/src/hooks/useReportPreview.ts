import { useMemo } from 'react';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReportConfig, ReportData } from '@/types/report';

export const useReportPreview = (config: ReportConfig): ReportData => {
  return useMemo(() => {
    // TODO: Substituir por chamada real à API
    // Por enquanto, gerar dados mockados baseados na configuração

    const { periodo, visualizacao, tipo } = config;

    // Gerar resumo
    const resumo = generateResumo(tipo);

    // Gerar gráficos
    const graficos = visualizacao.incluirGraficos ? generateGraficos(tipo, periodo) : [];

    // Gerar tabela
    const { colunas, linhas } = generateTabela(tipo, periodo);

    return {
      resumo,
      graficos,
      colunas,
      linhas
    };
  }, [config]);
};

function generateResumo(tipo: ReportConfig['tipo']) {
  if (tipo === 'financeiro') {
    return [
      {
        label: 'Receita Total',
        valor: 'R$ 125.480,00',
        variacao: 15.3,
        tendencia: 'up' as const
      },
      {
        label: 'Despesa Total',
        valor: 'R$ 78.250,00',
        variacao: -5.2,
        tendencia: 'down' as const
      },
      {
        label: 'Lucro Líquido',
        valor: 'R$ 47.230,00',
        variacao: 28.5,
        tendencia: 'up' as const
      }
    ];
  }

  if (tipo === 'estoque') {
    return [
      {
        label: 'Produtos Cadastrados',
        valor: '342',
        variacao: 8.5,
        tendencia: 'up' as const
      },
      {
        label: 'Valor Total em Estoque',
        valor: 'R$ 234.890,00',
        variacao: 3.2,
        tendencia: 'up' as const
      },
      {
        label: 'Itens Abaixo do Mínimo',
        valor: '12',
        variacao: -25.0,
        tendencia: 'down' as const
      }
    ];
  }

  return [];
}

function generateGraficos(tipo: ReportConfig['tipo'], periodo: ReportConfig['periodo']) {
  const graficos = [];

  if (tipo === 'financeiro') {
    // Gráfico de evolução
    const dados = generateTimeSeries(periodo, (i) => ({
      receitas: 15000 + Math.random() * 5000,
      despesas: 10000 + Math.random() * 3000
    }));

    graficos.push({
      titulo: 'Evolução Financeira',
      tipo: 'linha' as const,
      dados
    });

    // Gráfico de distribuição
    graficos.push({
      titulo: 'Distribuição de Despesas',
      tipo: 'pizza' as const,
      dados: [
        { label: 'Pessoal', valor: 35000 },
        { label: 'Operacional', valor: 25000 },
        { label: 'Marketing', valor: 10000 },
        { label: 'Infraestrutura', valor: 8250 }
      ]
    });
  }

  if (tipo === 'estoque') {
    // Gráfico de movimentação
    const dados = generateTimeSeries(periodo, (i) => ({
      entradas: Math.floor(50 + Math.random() * 30),
      saidas: Math.floor(40 + Math.random() * 25)
    }));

    graficos.push({
      titulo: 'Movimentação de Estoque',
      tipo: 'barra' as const,
      dados
    });

    // Gráfico de valor por categoria
    graficos.push({
      titulo: 'Valor por Categoria',
      tipo: 'pizza' as const,
      dados: [
        { label: 'Eletrônicos', valor: 85000 },
        { label: 'Roupas', valor: 62000 },
        { label: 'Alimentos', valor: 45000 },
        { label: 'Outros', valor: 42890 }
      ]
    });
  }

  return graficos;
}

function generateTabela(tipo: ReportConfig['tipo'], periodo: ReportConfig['periodo']) {
  if (tipo === 'financeiro') {
    return {
      colunas: ['Data', 'Descrição', 'Categoria', 'Receitas', 'Despesas', 'Saldo'],
      linhas: [
        [
          format(new Date(), 'dd/MM/yyyy'),
          'Venda de produtos',
          'Vendas',
          'R$ 5.250,00',
          '-',
          'R$ 5.250,00'
        ],
        [
          format(new Date(), 'dd/MM/yyyy'),
          'Pagamento fornecedor',
          'Operacional',
          '-',
          'R$ 2.800,00',
          'R$ 2.450,00'
        ],
        [
          format(new Date(), 'dd/MM/yyyy'),
          'Serviços prestados',
          'Serviços',
          'R$ 8.500,00',
          '-',
          'R$ 10.950,00'
        ],
        [
          format(new Date(), 'dd/MM/yyyy'),
          'Salários',
          'Pessoal',
          '-',
          'R$ 15.000,00',
          'R$ -4.050,00'
        ],
        [
          format(new Date(), 'dd/MM/yyyy'),
          'Comissões',
          'Vendas',
          'R$ 3.200,00',
          '-',
          'R$ -850,00'
        ]
      ]
    };
  }

  if (tipo === 'estoque') {
    return {
      colunas: ['Produto', 'Categoria', 'Quantidade', 'Valor Unitário', 'Valor Total', 'Status'],
      linhas: [
        ['Notebook Dell XPS 15', 'Eletrônicos', '25', 'R$ 6.500,00', 'R$ 162.500,00', 'Normal'],
        ['Mouse Logitech MX Master', 'Eletrônicos', '80', 'R$ 450,00', 'R$ 36.000,00', 'Normal'],
        ['Teclado Mecânico RGB', 'Eletrônicos', '5', 'R$ 580,00', 'R$ 2.900,00', 'Baixo'],
        ['Monitor LG UltraWide', 'Eletrônicos', '15', 'R$ 2.200,00', 'R$ 33.000,00', 'Normal'],
        ['Webcam Full HD', 'Eletrônicos', '3', 'R$ 320,00', 'R$ 960,00', 'Crítico']
      ]
    };
  }

  return {
    colunas: [],
    linhas: []
  };
}

function generateTimeSeries(
  periodo: ReportConfig['periodo'],
  generator: (index: number) => Record<string, number>
) {
  const { inicio, fim, tipo } = periodo;

  let intervals: Date[] = [];

  if (tipo === 'dia') {
    intervals = [inicio];
  } else if (tipo === 'semana') {
    intervals = eachDayOfInterval({ start: inicio, end: fim });
  } else if (tipo === 'mes' || tipo === 'trimestre') {
    intervals = eachDayOfInterval({ start: inicio, end: fim }).filter((_, i) => i % 3 === 0); // A cada 3 dias
  } else if (tipo === 'ano') {
    intervals = eachMonthOfInterval({ start: inicio, end: fim });
  } else {
    // customizado
    const daysDiff = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      intervals = eachDayOfInterval({ start: inicio, end: fim });
    } else if (daysDiff <= 31) {
      intervals = eachWeekOfInterval({ start: inicio, end: fim });
    } else {
      intervals = eachMonthOfInterval({ start: inicio, end: fim });
    }
  }

  return intervals.slice(0, 30).map((date, i) => ({
    label: format(date, tipo === 'ano' ? 'MMM/yy' : 'dd/MM', { locale: ptBR }),
    ...generator(i)
  }));
}
