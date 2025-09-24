import { OrionCard } from "@/components/OrionCard";
import { DollarSign, Clock, Cog, BarChart3 } from "lucide-react";

export const ProblemSection = () => {
  const problems = [
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Estoque Parado ou Faltando?",
      description: "Previsões baseadas em achismo custam caro. Excesso de produtos parados ou rupturas que fazem você perder vendas."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Horas Gastas com Tarefas Manuais?", 
      description: "Lançar notas e faturas uma a uma impede sua equipe de focar no que importa: fazer o negócio crescer."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Decisões no Escuro?",
      description: "Planilhas complexas escondem os insights que você precisa para crescer. Você reage ao que já aconteceu, não prevê o que vai acontecer."
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-primary mb-6">
            Sua gestão está mais para planilha<br />do que para painel de controle?
          </h2>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
            A maioria das PMEs varejistas ainda opera com sistemas que criam mais problemas do que soluções.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="text-center space-y-4 p-6 rounded-xl bg-white shadow-card hover:shadow-lg transition-all duration-300"
            >
              <div className="w-16 h-16 bg-action-primary/10 rounded-xl flex items-center justify-center mx-auto">
                <div className="text-action-primary">
                  {problem.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-orion-primary">
                {problem.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};