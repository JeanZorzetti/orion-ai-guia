"use client";

import { useState } from "react";
import { OrionButton } from "@/components/OrionButton";
import { Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export const OrionNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { label: "Programa Fundadores", href: "#fundadores" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Preços", href: "#precos" },
    { label: "Contato", href: "#contato" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-action rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-xl text-white">
              Orion <span className="text-action-primary">ERP</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <button className="text-white/80 hover:text-white transition-colors font-medium">
              Entrar
            </button>
            <OrionButton variant="action" size="sm">
              Demonstração
            </OrionButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "lg:hidden transition-all duration-300 overflow-hidden",
          isMenuOpen ? "max-h-96 pb-6" : "max-h-0"
        )}>
          <div className="space-y-4 pt-4 border-t border-white/20">
            {navigationItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="block text-white/80 hover:text-white transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4">
              <button className="text-left text-white/80 hover:text-white transition-colors font-medium">
                Entrar
              </button>
              <OrionButton variant="action" size="sm" className="w-full">
                Demonstração
              </OrionButton>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};