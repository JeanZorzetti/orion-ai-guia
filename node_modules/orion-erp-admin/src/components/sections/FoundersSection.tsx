import { OrionButton } from "@/components/OrionButton";
import { ArrowRight, Crown, Users,Clock } from "lucide-react";

export const FoundersSection = () => {
  return (
    <section className="py-24 bg-gradient-primary professional-dots relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-action-primary/20 rounded-full border border-action-primary/30 mb-8">
            <Crown className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              Oferta Exclusiva e Limitada
            </span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            Seja um Fundador 
            <span className="block text-action-primary">do Orion ERP</span>
          </h2>

          <p className="text-xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
            Estamos selecionando <strong className="text-action-primary">50 PMEs inovadoras</strong> para uma parceria estratégica com benefícios únicos, incluindo preços vitalícios e acesso antecipado a novas tecnologias.
          </p>

          {/* Benefícios */}
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-action-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Crown className="w-8 h-8 text-action-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Preço Vitalício</h3>
              <p className="text-white/80">Trave o preço especial para sempre cumprindo metas simples</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-action-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-action-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Acesso Antecipado</h3>
              <p className="text-white/80">Seja o primeiro a testar novas funcionalidades de IA</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-16 h-16 bg-action-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-action-primary" />
              </div>
              <h3 className="text-lg font-semibold text-white">Suporte Premium</h3>
              <p className="text-white/80">Linha direta com nossos especialistas</p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 inline-block">
              <div className="flex items-center justify-center gap-4 text-white">
                <span className="text-2xl font-bold text-action-primary">12</span>
                <span className="text-sm">Vagas Restantes</span>
              </div>
            </div>
            
            <OrionButton variant="action" size="lg" className="group shadow-glow">
              <Crown className="w-5 h-5" />
              Quero Ser um Fundador
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </OrionButton>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-action-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  );
};