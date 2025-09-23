import React, { useEffect, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  id: number;
  title: string;
  description: string;
  targetSelector: string;
  route?: string;
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: 'Tudo começa aqui',
    description: 'Clique para importar sua primeira fatura ou use nosso arquivo de exemplo.',
    targetSelector: '[data-tour="import-button"]',
    route: '/admin/dashboard',
  },
  {
    id: 2,
    title: 'IA em ação',
    description: 'Nossa IA já preencheu tudo para você. Apenas confira e salve.',
    targetSelector: '[data-tour="form-validation"]',
    route: '/admin/financeiro/contas-a-pagar',
  },
  {
    id: 3,
    title: 'Prevendo o futuro',
    description: 'Com base nos dados que você inseriu, esta é a sua previsão de demanda. Nunca mais tome decisões no escuro.',
    targetSelector: '[data-tour="prediction-card"]',
    route: '/admin/estoque/produtos/1',
  },
];

const GuidedTour: React.FC = () => {
  const { currentStep, nextStep, completeOnboarding, skipOnboarding } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  const currentTourStep = tourSteps.find(step => step.id === currentStep);

  useEffect(() => {
    if (currentTourStep?.route && location.pathname !== currentTourStep.route) {
      navigate(currentTourStep.route);
    }
  }, [currentStep, currentTourStep, navigate, location.pathname]);

  useEffect(() => {
    if (!currentTourStep) return;

    const findAndHighlightTarget = () => {
      const element = document.querySelector(currentTourStep.targetSelector) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate tooltip position
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        setTooltipPosition({
          top: rect.top + scrollTop + rect.height + 10,
          left: rect.left + scrollLeft + rect.width / 2,
        });

        // Add highlight class
        element.classList.add('tour-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Wait for navigation to complete
    const timer = setTimeout(findAndHighlightTarget, 500);
    
    return () => {
      clearTimeout(timer);
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, currentTourStep, targetElement]);

  const handleNext = () => {
    if (currentStep === tourSteps.length) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  const handleComplete = () => {
    completeOnboarding();
  };

  if (!currentTourStep) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-50 w-80 shadow-lg border-primary/20"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)',
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {currentStep}
              </div>
              <h3 className="font-semibold">{currentTourStep.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {currentTourStep.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {currentStep} de {tourSteps.length}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={skipOnboarding}>
                Pular
              </Button>
              {currentStep === tourSteps.length ? (
                <Button size="sm" onClick={handleComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
              ) : (
                <Button size="sm" onClick={handleNext}>
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tour highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 0 0 8px hsl(var(--primary) / 0.1);
          border-radius: 8px;
        }
      `}</style>
    </>
  );
};

export default GuidedTour;