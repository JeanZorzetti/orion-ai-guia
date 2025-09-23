import { Sparkles, Mail, Phone, MapPin, Linkedin, Twitter, Instagram } from "lucide-react";

export const OrionFooter = () => {
  const footerSections = [
    {
      title: "Produto",
      links: [
        { label: "Recursos", href: "#recursos" },
        { label: "Preços", href: "#precos" },
        { label: "Demo", href: "#demo" },
        { label: "Integração", href: "#integracao" }
      ]
    },
    {
      title: "Empresa",
      links: [
        { label: "Sobre Nós", href: "#sobre" },
        { label: "Carreiras", href: "#carreiras" },
        { label: "Blog", href: "#blog" },
        { label: "Imprensa", href: "#imprensa" }
      ]
    },
    {
      title: "Suporte",
      links: [
        { label: "Central de Ajuda", href: "#ajuda" },
        { label: "Documentação", href: "#docs" },
        { label: "API", href: "#api" },
        { label: "Status", href: "#status" }
      ]
    },
    {
      title: "Legal",
      links: [
        { label: "Termos de Uso", href: "#termos" },
        { label: "Política de Privacidade", href: "#privacidade" },
        { label: "LGPD", href: "#lgpd" },
        { label: "Segurança", href: "#seguranca" }
      ]
    }
  ];

  return (
    <footer className="bg-orion-deep text-space-white">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-constellation rounded-xl flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-space-white" />
              </div>
              <div className="font-bold text-2xl">
                Orion <span className="text-constellation">ERP</span>
              </div>
            </div>
            
            <p className="text-space-light/80 leading-relaxed max-w-md">
              A inteligência que guia o crescimento do seu negócio. Transforme sua PME com o primeiro ERP com IA do Brasil.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-space-light/80">
                <Mail className="w-5 h-5 text-constellation" />
                <span>contato@orionerp.com.br</span>
              </div>
              <div className="flex items-center gap-3 text-space-light/80">
                <Phone className="w-5 h-5 text-constellation" />
                <span>(11) 3000-0000</span>
              </div>
              <div className="flex items-center gap-3 text-space-light/80">
                <MapPin className="w-5 h-5 text-constellation" />
                <span>São Paulo, SP - Brasil</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-orion-nebula rounded-lg flex items-center justify-center hover:bg-constellation transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-orion-nebula rounded-lg flex items-center justify-center hover:bg-constellation transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-orion-nebula rounded-lg flex items-center justify-center hover:bg-constellation transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="font-semibold text-lg text-space-white">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-space-light/80 hover:text-constellation transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-orion-nebula flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-space-light/60">
            © 2024 Orion ERP. Todos os direitos reservados.
          </div>
          
          <div className="flex items-center gap-6 text-sm text-space-light/60">
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              Sistema Online
            </span>
            <span>ISO 27001 Certificado</span>
            <span>LGPD Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};