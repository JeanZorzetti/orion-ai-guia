import { Badge } from "@/components/ui/badge";

export const MediaSection = () => {
  const mediaLogos = [
    "Exame",
    "Pequenas Empresas & Grandes Negócios", 
    "Startups.com.br",
    "Valor Econômico",
    "InfoMoney"
  ];

  return (
    <section className="py-12 bg-neutral-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <p className="text-sm text-neutral-600 mb-4">
            A revolução dos ERPs inteligentes para PMEs está começando
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
          {mediaLogos.map((logo, index) => (
            <div key={index} className="text-orion-primary font-semibold text-sm">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};