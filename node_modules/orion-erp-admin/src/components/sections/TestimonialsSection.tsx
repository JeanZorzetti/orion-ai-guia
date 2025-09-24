import { Star, Quote } from "lucide-react";
import { OrionCard } from "@/components/OrionCard";

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Marina Santos",
      role: "CEO",
      company: "TechFlow Solutions",
      image: "https://images.unsplash.com/photo-1494790108755-2616b72946c7?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      quote: "Com o Orion, nossa previsão de estoque melhorou em 40%. Deixamos de apagar incêndios para focar em estratégia."
    },
    {
      name: "Carlos Mendoza", 
      role: "Diretor Financeiro",
      company: "Inovare Distribuição",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      quote: "A automação do financeiro nos economiza 15 horas por semana. O ROI foi imediato e surpreendente."
    },
    {
      name: "Ana Rodrigues",
      role: "Gestora de Operações", 
      company: "Prime Logistics",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
      rating: 5,
      quote: "Implementação em 3 semanas vs 6 meses do sistema anterior. A equipe adotou naturalmente."
    }
  ];

  return (
    <section className="py-24 bg-gradient-cosmic">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-orion-deep mb-6">
            O que os Gestores do Futuro 
            <span className="block text-constellation">Estão Dizendo</span>
          </h2>
          <p className="text-xl text-space-dark max-w-3xl mx-auto leading-relaxed">
            Empresas que já fazem a gestão inteligente com Orion ERP compartilham seus resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <OrionCard
              key={index}
              variant="feature"
              title=""
              className="relative hover:scale-105 transition-transform duration-300"
            >
              <div className="space-y-6">
                {/* Quote Icon */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 bg-constellation/10 rounded-full flex items-center justify-center">
                    <Quote className="w-6 h-6 text-constellation" />
                  </div>
                </div>
                
                {/* Stars */}
                <div className="flex justify-center gap-1">
                  {[...Array(testimonial.rating)].map((_, starIndex) => (
                    <Star 
                      key={starIndex} 
                      className="w-5 h-5 fill-stellar text-stellar" 
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-lg text-space-dark leading-relaxed text-center italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-space-medium/30">
                  <img 
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-orion-deep">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-space-dark">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </OrionCard>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-space-medium/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-constellation mb-2">500+</div>
            <div className="text-space-dark">PMEs Transformadas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-constellation mb-2">4.9/5</div>
            <div className="text-space-dark">Satisfação dos Clientes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-constellation mb-2">35%</div>
            <div className="text-space-dark">Aumento Médio de Lucro</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-constellation mb-2">99.9%</div>
            <div className="text-space-dark">Uptime Garantido</div>
          </div>
        </div>
      </div>
    </section>
  );
};