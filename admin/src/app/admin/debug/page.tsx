import { DebugDataPanel } from '@/components/debug/DebugDataPanel'

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🛠️ Ferramentas de Debug</h1>

        <DebugDataPanel />

        {/* Espaço para mais painéis de debug no futuro */}
        <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">💡 Dicas de uso</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>
              <strong>Popular dados:</strong> Cria um cenário completo de indústria de moda praia
              com produtos, clientes e 12 meses de vendas históricas.
            </li>
            <li>
              <strong>Limpar dados:</strong> Remove TODOS os dados de debug criados.
              Use antes de popular novamente para evitar duplicação.
            </li>
            <li>
              <strong>Status:</strong> Mostra quantos dados de debug existem atualmente no sistema.
            </li>
            <li>
              <strong>Sazonalidade:</strong> As vendas seguem padrão realista com picos no verão
              (Nov-Fev) e baixa no inverno (Jun-Ago).
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
