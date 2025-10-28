import { useState, useMemo } from 'react';
import { ApprovalWorkflow } from '@/types/approval';

// Mock data para desenvolvimento
const mockWorkflows: ApprovalWorkflow[] = [
  {
    id: '1',
    nome: 'Aprovação Padrão até R$ 10.000',
    descricao: 'Workflow automático para faturas até R$ 10.000',
    ativo: true,
    condicoes: {
      valorMaximo: 10000,
    },
    niveis: [
      {
        nivel: 1,
        nome: 'Gerente Financeiro',
        aprovadores: [
          {
            usuarioId: '1',
            nome: 'Carlos Silva',
            email: 'carlos.silva@empresa.com',
          },
        ],
        tipoAprovacao: 'qualquer_um',
        prazoHoras: 24,
        obrigatorio: true,
      },
    ],
    dataCriacao: new Date('2025-01-15'),
    criadoPor: 'Admin',
  },
  {
    id: '2',
    nome: 'Aprovação Multinível acima de R$ 10.000',
    descricao: 'Workflow com 2 níveis para faturas acima de R$ 10.000',
    ativo: true,
    condicoes: {
      valorMinimo: 10000,
    },
    niveis: [
      {
        nivel: 1,
        nome: 'Gerente Financeiro',
        aprovadores: [
          {
            usuarioId: '1',
            nome: 'Carlos Silva',
            email: 'carlos.silva@empresa.com',
          },
          {
            usuarioId: '2',
            nome: 'Ana Costa',
            email: 'ana.costa@empresa.com',
          },
        ],
        tipoAprovacao: 'qualquer_um',
        prazoHoras: 48,
        obrigatorio: true,
      },
      {
        nivel: 2,
        nome: 'Diretor Financeiro',
        aprovadores: [
          {
            usuarioId: '3',
            nome: 'Roberto Mendes',
            email: 'roberto.mendes@empresa.com',
          },
        ],
        tipoAprovacao: 'todos',
        prazoHoras: 72,
        obrigatorio: true,
      },
    ],
    dataCriacao: new Date('2025-01-15'),
    criadoPor: 'Admin',
  },
  {
    id: '3',
    nome: 'Aprovação Expressa - Fornecedores Confiáveis',
    descricao: 'Aprovação simplificada para fornecedores pré-aprovados',
    ativo: true,
    condicoes: {
      valorMaximo: 5000,
      fornecedores: ['1', '2', '5'], // IDs dos fornecedores confiáveis
    },
    niveis: [
      {
        nivel: 1,
        nome: 'Analista Financeiro',
        aprovadores: [
          {
            usuarioId: '4',
            nome: 'Paula Rodrigues',
            email: 'paula.rodrigues@empresa.com',
          },
          {
            usuarioId: '5',
            nome: 'Marcos Oliveira',
            email: 'marcos.oliveira@empresa.com',
          },
        ],
        tipoAprovacao: 'qualquer_um',
        prazoHoras: 12,
        obrigatorio: true,
      },
    ],
    dataCriacao: new Date('2025-02-01'),
    criadoPor: 'Admin',
  },
  {
    id: '4',
    nome: 'Aprovação Crítica - Valores Altos',
    descricao: '3 níveis de aprovação para valores acima de R$ 50.000',
    ativo: false,
    condicoes: {
      valorMinimo: 50000,
    },
    niveis: [
      {
        nivel: 1,
        nome: 'Gerente Financeiro',
        aprovadores: [
          {
            usuarioId: '1',
            nome: 'Carlos Silva',
            email: 'carlos.silva@empresa.com',
          },
        ],
        tipoAprovacao: 'todos',
        prazoHoras: 24,
        obrigatorio: true,
      },
      {
        nivel: 2,
        nome: 'Diretor Financeiro',
        aprovadores: [
          {
            usuarioId: '3',
            nome: 'Roberto Mendes',
            email: 'roberto.mendes@empresa.com',
          },
        ],
        tipoAprovacao: 'todos',
        prazoHoras: 48,
        obrigatorio: true,
      },
      {
        nivel: 3,
        nome: 'CEO',
        aprovadores: [
          {
            usuarioId: '6',
            nome: 'Fernanda Lima',
            email: 'fernanda.lima@empresa.com',
          },
        ],
        tipoAprovacao: 'todos',
        prazoHoras: 72,
        obrigatorio: true,
        condicoesEspeciais: {
          valorMinimo: 100000,
        },
      },
    ],
    dataCriacao: new Date('2025-01-20'),
    criadoPor: 'Admin',
  },
];

export function useApprovalWorkflows() {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(mockWorkflows);

  const activeWorkflows = useMemo(
    () => workflows.filter((w) => w.ativo),
    [workflows]
  );

  const createWorkflow = (workflow: Omit<ApprovalWorkflow, 'id' | 'dataCriacao'>) => {
    const newWorkflow: ApprovalWorkflow = {
      ...workflow,
      id: Date.now().toString(),
      dataCriacao: new Date(),
    };
    setWorkflows([...workflows, newWorkflow]);
    return newWorkflow;
  };

  const updateWorkflow = (id: string, updates: Partial<ApprovalWorkflow>) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id
          ? { ...w, ...updates, dataAtualizacao: new Date() }
          : w
      )
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
  };

  const toggleWorkflow = (id: string, ativo: boolean) => {
    updateWorkflow(id, { ativo });
  };

  const findMatchingWorkflow = (
    valorFatura: number,
    fornecedorId?: string,
    categoria?: string
  ): ApprovalWorkflow | null => {
    // Procura o workflow ativo mais específico que corresponda às condições
    const matching = activeWorkflows.filter((workflow) => {
      const cond = workflow.condicoes;

      // Verifica valor mínimo
      if (cond.valorMinimo && valorFatura < cond.valorMinimo) {
        return false;
      }

      // Verifica valor máximo
      if (cond.valorMaximo && valorFatura > cond.valorMaximo) {
        return false;
      }

      // Verifica fornecedor específico
      if (
        cond.fornecedores &&
        cond.fornecedores.length > 0 &&
        fornecedorId &&
        !cond.fornecedores.includes(fornecedorId)
      ) {
        return false;
      }

      // Verifica categoria específica
      if (
        cond.categorias &&
        cond.categorias.length > 0 &&
        categoria &&
        !cond.categorias.includes(categoria)
      ) {
        return false;
      }

      return true;
    });

    // Retorna o mais específico (com mais condições definidas)
    if (matching.length === 0) return null;

    return matching.sort((a, b) => {
      const scoreA = Object.values(a.condicoes).filter(Boolean).length;
      const scoreB = Object.values(b.condicoes).filter(Boolean).length;
      return scoreB - scoreA; // Mais específico primeiro
    })[0];
  };

  return {
    workflows,
    activeWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    findMatchingWorkflow,
  };
}
