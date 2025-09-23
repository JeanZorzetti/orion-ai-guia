import { ArrowRight, FileText, TrendingUp } from "lucide-react";

export const DemoSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-primary mb-6">
            Veja a IA trabalhando para você
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Dois exemplos práticos de como o Orion ERP transforma processos manuais em inteligência automatizada.
          </p>
        </div>

        <div className="space-y-16">
          {/* Demo 1: Fatura to Lançamento */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-orion-primary">
                De Fatura a Lançamento em Segundos
              </h3>
              <p className="text-lg text-neutral-600 leading-relaxed">
                Nossa IA lê, entende e lança suas contas a pagar por você. Acabou o trabalho manual de digitar nota por nota.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Extração automática de dados da fatura</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Categorização inteligente de despesas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Lançamento direto no contas a pagar</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="bg-white p-4 rounded-lg shadow-card border-2 border-dashed border-neutral-200">
                  <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-xs text-neutral-500 text-center">Fatura PDF</p>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-action-primary" />
                </div>
                
                <div className="bg-action-primary/10 p-4 rounded-lg border border-action-primary/20">
                  <div className="space-y-2">
                    <div className="h-2 bg-action-primary/40 rounded w-full"></div>
                    <div className="h-2 bg-action-primary/40 rounded w-3/4"></div>
                    <div className="h-2 bg-action-primary/40 rounded w-1/2"></div>
                  </div>
                  <p className="text-xs text-action-primary text-center mt-2">Lançado automaticamente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Demo 2: Histórico to Previsão */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="bg-white p-4 rounded-lg shadow-card border-2 border-dashed border-neutral-200">
                  <div className="space-y-1">
                    <div className="h-1 bg-neutral-300 rounded w-full"></div>
                    <div className="h-1 bg-neutral-300 rounded w-4/5"></div>
                    <div className="h-1 bg-neutral-300 rounded w-3/5"></div>
                    <div className="h-1 bg-neutral-300 rounded w-full"></div>
                  </div>
                  <p className="text-xs text-neutral-500 text-center mt-2">Histórico de Vendas</p>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-action-primary" />
                </div>
                
                <div className="bg-action-primary/10 p-4 rounded-lg border border-action-primary/20">
                  <TrendingUp className="w-8 h-8 text-action-primary mx-auto mb-2" />
                  <p className="text-xs text-action-primary text-center">Previsão IA</p>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <h3 className="text-2xl font-bold text-orion-primary">
                De Histórico a Previsão em um Clique
              </h3>
              <p className="text-lg text-neutral-600 leading-relaxed">
                Saiba o que vender, quando comprar e nunca mais perca uma venda. Nossa IA analisa padrões e prevê demandas.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Análise de sazonalidade e tendências</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Previsão de demanda por produto</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-action-primary rounded-full"></div>
                  <span className="text-neutral-600">Alertas de reposição inteligentes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};