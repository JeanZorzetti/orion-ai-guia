import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboarding } from './OnboardingProvider';
import { Sparkles, Clock } from 'lucide-react';

const WelcomeModal: React.FC = () => {
  const { startOnboarding, skipOnboarding } = useOnboarding();

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">
            Bem-vindo(a) ao Orion ERP, João!
          </DialogTitle>
          <DialogDescription className="text-base mt-4">
            Vamos transformar a gestão da sua empresa. Nos próximos 2 minutos, 
            vamos automatizar sua primeira fatura e criar sua primeira previsão de vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Aproximadamente 2 minutos</span>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={skipOnboarding}>
            Pular Tour
          </Button>
          <Button onClick={startOnboarding} className="flex-1">
            Sim, vamos lá!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;