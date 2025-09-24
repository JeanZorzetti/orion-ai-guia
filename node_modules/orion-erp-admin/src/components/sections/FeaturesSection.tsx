import { useState } from "react";
import { OrionCard } from "@/components/OrionCard";
import { MessageSquare, TrendingUp, CreditCard, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Copiloto de Negócios",
      description: "Converse com seus dados. Peça em linguagem natural: 'Qual a previsão de faturamento para o próximo trimestre?' e receba relatórios e gráficos instantaneamente.",
      details: "Nossa IA conversacional entende contexto empresarial e responde em linguagem natural. Faça perguntas complexas sobre seu negócio e receba insights acionáveis em segundos."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Previsão de Demanda",
      description: "Nunca mais perca vendas por falta de estoque. Nossa IA analisa histórico e tendências para sugerir o momento e a quantidade certa para comprar.",
      details: "Algoritmos de machine learning analisam sazonalidade, tendências de mercado e comportamento de compra para otimizar seu estoque e maximizar vendas."
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Financeiro Inteligente",
      description: "Automatize o contas a pagar lendo boletos e faturas em PDF. Identifique anomalias e previna fraudes antes que aconteçam.",
      details: "OCR avançado + IA para extrair dados de documentos, detectar duplicatas, validar informações e alertar sobre inconsistências financeiras."
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Visão de Estoque (Visionário)",
      description: "Em breve: monitore seu inventário em tempo real com câmeras inteligentes, eliminando a contagem manual.",
      details: "Computer vision para reconhecimento automático de produtos, monitoramento de níveis de estoque e alertas inteligentes de reposição."
    }
  ];

  return (
    <section className="py-24 bg-gradient-cosmic">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-deep mb-6">
            Transforme Dados em 
            <span className="block text-constellation">Decisões Estratégicas</span>
          </h2>
          <p className="text-xl text-space-dark max-w-3xl mx-auto leading-relaxed">
            Veja como a inteligência do Orion funciona na prática para revolucionar a gestão da sua PME.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                activeTab === index
                  ? "bg-constellation text-space-white shadow-constellation"
                  : "bg-space-white text-space-dark hover:bg-space-light border-2 border-space-medium"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                activeTab === index ? "bg-space-white/20" : "bg-constellation/10"
              )}>
                <div className={cn(
                  activeTab === index ? "text-space-white" : "text-constellation"
                )}>
                  {feature.icon}
                </div>
              </div>
              <span className="hidden sm:block">{feature.title}</span>
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        <div className="max-w-4xl mx-auto">
          <OrionCard
            variant="feature"
            title={features[activeTab].title}
            description={features[activeTab].description}
            className="text-center"
          >
            <div className="mt-6 p-6 bg-space-light/50 rounded-xl border border-constellation/10">
              <p className="text-space-dark leading-relaxed">
                {features[activeTab].details}
              </p>
            </div>
          </OrionCard>
        </div>
      </div>
    </section>
  );
};