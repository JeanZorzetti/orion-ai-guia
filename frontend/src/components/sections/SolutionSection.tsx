import { OrionCard } from "@/components/OrionCard";
import { OrionButton } from "@/components/OrionButton";
import { Brain, Zap, Shield, Target } from "lucide-react";

export const SolutionSection = () => {
  const solutions = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Inteligência Acessível",
      description: "Oferecemos funcionalidades de IA sofisticadas (análise preditiva, automação com PLN, IA generativa) que resolvem problemas de negócio reais, mas com foco obsessivo em usabilidade. Você não precisa ser um cientista de dados para usar o poder dos dados."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Experiência de Implementação Superior",
      description: "Transformamos o tradicionalmente doloroso e caro processo de implementação de um ERP em um diferencial competitivo. Oferecemos onboarding guiado por IA, transparência total de custos e Gestão da Mudança como Serviço."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Conformidade Nativa (LGPD by Design)",
      description: "Nascemos com a Lei Geral de Proteção de Dados como um pilar da arquitetura, garantindo segurança e privacidade como um valor intrínseco, não um adendo."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-action-primary/10 rounded-full border border-action-primary/20 mb-6">
            <Brain className="w-4 h-4 text-action-primary" />
            <span className="text-sm font-medium text-action-primary">
              Os 3 Pilares da Orion ERP
            </span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-primary mb-6">
            A inteligência que guia o 
            <span className="block text-action-primary">crescimento do seu negócio</span>
          </h2>
          
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            Orion ERP se sustenta em três pilares inegociáveis que transformam sua gestão de um sistema de registro passivo para um cérebro operacional proativo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {solutions.map((solution, index) => (
            <div 
              key={index}
              className="p-8 rounded-xl bg-gradient-subtle border border-neutral-200 hover:border-action-primary/30 hover:shadow-card transition-all duration-300"
            >
              <div className="w-16 h-16 bg-action-primary/10 rounded-xl flex items-center justify-center mb-6">
                <div className="text-action-primary">
                  {solution.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-orion-primary mb-4">
                {solution.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {solution.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <OrionButton variant="primary" size="lg">
            Descobrir Como Funciona
          </OrionButton>
        </div>
      </div>
    </section>
  );
};