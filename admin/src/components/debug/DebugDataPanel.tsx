'use client'

import { useState } from 'react'
import { AlertTriangle, Database, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface SeedStats {
  products_created: number
  customers_created: number
  sales_created: number
  total_revenue: number
  months_generated: number
  average_ticket: number
  date_range: {
    start: string
    end: string
  }
}

interface ClearStats {
  products_deleted: number
  customers_deleted: number
  sales_deleted: number
  transactions_deleted: number
}

interface SeedStatus {
  has_debug_data: boolean
  products_count: number
  customers_count: number
  sales_count: number
  total_revenue: number
  average_ticket: number
}

export function DebugDataPanel() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [seedResult, setSeedResult] = useState<SeedStats | null>(null)
  const [clearResult, setClearResult] = useState<ClearStats | null>(null)
  const [status, setStatus] = useState<SeedStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  // Busca status atual
  const checkStatus = async () => {
    setIsCheckingStatus(true)
    setError(null)

    try {
      const data = await api.get<SeedStatus>('/debug/seed-status')
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Popular dados
  const seedData = async () => {
    setIsSeeding(true)
    setError(null)
    setSeedResult(null)

    try {
      const data = await api.post<{ stats: SeedStats }>('/debug/seed-beach-fashion?months=12')
      setSeedResult(data.stats)

      // Atualiza status
      await checkStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsSeeding(false)
    }
  }

  // Limpar dados
  const clearData = async () => {
    setIsClearing(true)
    setError(null)
    setClearResult(null)

    try {
      const data = await api.delete<{ stats: ClearStats }>('/debug/clear-debug-data?confirm=true')
      setClearResult(data.stats)
      setSeedResult(null)

      // Atualiza status
      await checkStatus()
      setShowConfirmClear(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-yellow-900 mb-1">
            🛠️ Painel de Debug - Dados de Teste
          </h2>
          <p className="text-sm text-yellow-700">
            Popule o sistema com dados realistas de uma indústria de moda praia (R$ 7M/ano, 3 lojas).
            Útil para testes e demonstrações.
          </p>
        </div>
      </div>

      {/* Status Atual */}
      <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Status Atual</h3>
          <button
            onClick={checkStatus}
            disabled={isCheckingStatus}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
          >
            {isCheckingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Atualizar'
            )}
          </button>
        </div>

        {status ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Produtos</div>
              <div className="font-bold text-lg">{status.products_count}</div>
            </div>
            <div>
              <div className="text-gray-500">Clientes</div>
              <div className="font-bold text-lg">{status.customers_count}</div>
            </div>
            <div>
              <div className="text-gray-500">Vendas</div>
              <div className="font-bold text-lg">{status.sales_count}</div>
            </div>
            <div>
              <div className="text-gray-500">Faturamento</div>
              <div className="font-bold text-lg">
                R$ {(status.total_revenue / 1000).toFixed(0)}k
              </div>
            </div>
            <div>
              <div className="text-gray-500">Ticket Médio</div>
              <div className="font-bold text-lg">
                R$ {status.average_ticket.toFixed(0)}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Clique em "Atualizar" para ver o status</p>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Botão Popular */}
        <button
          onClick={seedData}
          disabled={isSeeding || isClearing}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSeeding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Populando dados...
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              🏖️ Popular Dados (Moda Praia)
            </>
          )}
        </button>

        {/* Botão Limpar */}
        {!showConfirmClear ? (
          <button
            onClick={() => setShowConfirmClear(true)}
            disabled={isSeeding || isClearing || (status ? !status.has_debug_data : false)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            🗑️ Limpar Dados de Debug
          </button>
        ) : (
          <div className="flex-1 bg-red-100 border-2 border-red-400 rounded-lg p-3">
            <p className="text-sm text-red-800 font-semibold mb-2">
              ⚠️ Tem certeza? Esta ação é IRREVERSÍVEL!
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearData}
                disabled={isClearing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Sim, limpar tudo'
                )}
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                disabled={isClearing}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3 mb-4">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Erro</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Resultado do Seeding */}
      {seedResult && (
        <div className="bg-green-50 border border-green-300 rounded-lg p-4 flex items-start gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-900 mb-2">
              ✅ Dados criados com sucesso!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-green-800">
              <div>
                <span className="font-semibold">{seedResult.products_created}</span> produtos
              </div>
              <div>
                <span className="font-semibold">{seedResult.customers_created}</span> clientes
              </div>
              <div>
                <span className="font-semibold">{seedResult.sales_created}</span> vendas
              </div>
              <div>
                <span className="font-semibold">R$ {(seedResult.total_revenue / 1000).toFixed(0)}k</span> faturamento
              </div>
              <div>
                <span className="font-semibold">R$ {seedResult.average_ticket.toFixed(0)}</span> ticket médio
              </div>
              <div>
                <span className="font-semibold">{seedResult.months_generated}</span> meses de histórico
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado da Limpeza */}
      {clearResult && (
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-blue-900 mb-2">
              🗑️ Dados removidos com sucesso!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-blue-800">
              <div>
                <span className="font-semibold">{clearResult.products_deleted}</span> produtos
              </div>
              <div>
                <span className="font-semibold">{clearResult.customers_deleted}</span> clientes
              </div>
              <div>
                <span className="font-semibold">{clearResult.sales_deleted}</span> vendas
              </div>
              <div>
                <span className="font-semibold">{clearResult.transactions_deleted}</span> transações
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Descrição dos dados */}
      <div className="mt-6 pt-4 border-t border-yellow-300">
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
            📋 O que será criado?
          </summary>
          <div className="mt-3 space-y-2 text-gray-600">
            <p><strong>Produtos (27 itens):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>10 modelos de biquínis femininos (R$ 189-279)</li>
              <li>4 modelos de maiôs femininos (R$ 249-299)</li>
              <li>5 modelos masculinos - sungas e shorts (R$ 89-149)</li>
              <li>3 modelos infantis (R$ 59-99)</li>
              <li>5 acessórios - saídas, chapéus, cangas (R$ 69-159)</li>
            </ul>

            <p className="mt-3"><strong>Clientes (36 perfis):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Mix de clientes femininos e masculinos</li>
              <li>Perfis variados (varejo, corporativo, revendedores)</li>
            </ul>

            <p className="mt-3"><strong>Vendas (12 meses):</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>~2.700 vendas distribuídas ao longo de 1 ano</li>
              <li>Sazonalidade realista (pico Nov-Fev, baixa Jun-Ago)</li>
              <li>Múltiplos canais (lojas físicas, e-commerce, marketplaces)</li>
              <li>Faturamento total: ~R$ 700k (R$ 58k/mês médio)</li>
              <li>Ticket médio: R$ 262</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
        <p className="text-xs text-yellow-800">
          <strong>⚠️ Aviso:</strong> Este painel é apenas para desenvolvimento/testes.
          Remova ou proteja este componente em produção.
        </p>
      </div>
    </div>
  )
}
