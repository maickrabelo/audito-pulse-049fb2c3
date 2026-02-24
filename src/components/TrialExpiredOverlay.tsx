import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealAuth } from '@/contexts/RealAuthContext';

const TrialExpiredOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useRealAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Período de teste encerrado</CardTitle>
          <CardDescription className="text-base mt-2">
            Seu período de teste de 7 dias expirou. Para continuar utilizando a plataforma,
            contrate um dos nossos planos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate('/contratar')}
          >
            Ver planos e contratar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialExpiredOverlay;
