"use client";

import { OrionButton } from "@/components/OrionButton";
import { ArrowRight, Sparkles } from "lucide-react";
const heroImage = "/assets/orion-hero.jpg";

export const HeroSection = () => {
  return (
    <section className="relative bg-gradient-hero professional-dots overflow-hidden py-24 lg:py-32">
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-action-primary/10 rounded-full border border-action-primary/20">
              <Sparkles className="w-4 h-4 text-action-primary" />
              <span className="text-sm font-medium text-action-primary">
                Gestão Inteligente para PMEs Ambiciosas
              </span>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
                Sua gestão ainda opera
                <span className="block text-action-primary">no passado?</span>
                <span className="block">O futuro é um ERP com IA.</span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                O <strong className="text-white">Orion ERP</strong> automatiza suas finanças, prevê suas vendas e transforma dados em lucro. Feito para PMEs brasileiras que não têm tempo a perder.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <OrionButton
                variant="action"
                size="lg"
                className="group"
                onClick={() => window.location.href = '/login'}
              >
                Acesse o Sistema
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </OrionButton>

              <OrionButton variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orion-primary">
                Conheça o Programa Fundadores
              </OrionButton>
            </div>

            <div className="flex items-center gap-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">80%</div>
                <div className="text-sm text-white/80">Redução em processos manuais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">R$ 5M-50M</div>
                <div className="text-sm text-white/80">Faturamento ideal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">50</div>
                <div className="text-sm text-white/80">Vagas Fundadores</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-card bg-white/10 backdrop-blur-sm border border-white/20">
              <img
                src={heroImage}
                alt="Dashboard Orion ERP com IA para PMEs"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orion-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-action-primary/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-700"></div>
          </div>
        </div>
      </div>
    </section>
  );
};