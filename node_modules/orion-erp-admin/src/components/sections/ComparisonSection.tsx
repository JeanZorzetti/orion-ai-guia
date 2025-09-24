import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const ComparisonSection = () => {
  const comparisonData = [
    {
      criterion: "Arquitetura",
      traditional: "Legada",
      orion: "IA-First",
      highlight: true
    },
    {
      criterion: "Implementação", 
      traditional: "Lenta e Complexa",
      orion: "Rápida e Guiada",
      highlight: false
    },
    {
      criterion: "Custo",
      traditional: "Alto e Imprevisível", 
      orion: "Transparente e Acessível",
      highlight: true
    },
    {
      criterion: "Customização",
      traditional: "Cara e Dependente",
      orion: "Ágil e Autônoma", 
      highlight: false
    },
    {
      criterion: "Tomada de Decisão",
      traditional: "Reativa (baseada no passado)",
      orion: "Preditiva (focada no futuro)",
      highlight: true
    },
    {
      criterion: "Conformidade LGPD",
      traditional: "Adaptada",
      orion: "Nativa",
      highlight: false
    }
  ];

  return (
    <section className="py-24 bg-space-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-deep mb-6">
            A Diferença entre um ERP Comum 
            <span className="block text-constellation">e um ERP Inteligente</span>
          </h2>
          <p className="text-xl text-space-dark max-w-3xl mx-auto leading-relaxed">
            Veja por que milhares de PMEs estão migrando para sistemas de gestão com inteligência artificial.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-space-white to-space-light rounded-3xl shadow-orion border border-space-medium overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-orion-deep text-space-white p-6">
              <div className="text-lg font-semibold">Critério</div>
              <div className="text-lg font-semibold text-center">ERP Tradicional</div>
              <div className="text-lg font-semibold text-center text-constellation">Orion ERP</div>
            </div>

            {/* Comparison Rows */}
            {comparisonData.map((row, index) => (
              <div 
                key={index}
                className={cn(
                  "grid grid-cols-3 p-6 border-b border-space-medium/30 transition-colors hover:bg-space-light/50",
                  row.highlight && "bg-constellation/5"
                )}
              >
                <div className="font-semibold text-orion-deep flex items-center">
                  {row.criterion}
                </div>
                
                <div className="text-center flex items-center justify-center gap-2">
                  <X className="w-5 h-5 text-destructive" />
                  <span className="text-space-dark">{row.traditional}</span>
                </div>
                
                <div className="text-center flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-constellation" />
                  <span className="font-medium text-orion-deep">{row.orion}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 p-8 bg-gradient-constellation rounded-2xl text-space-white">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para fazer a mudança?
            </h3>
            <p className="text-lg mb-6 text-space-white/90">
              Junte-se às PMEs que já descobriram o poder da gestão inteligente.
            </p>
            <button className="bg-space-white text-constellation px-8 py-3 rounded-xl font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105">
              Comparar com Meu Sistema Atual
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};