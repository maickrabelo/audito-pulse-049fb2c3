import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // You can use sessionId to fetch additional details if needed
    console.log('Checkout session ID:', sessionId);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </div>

          <div className="bg-muted/50 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <p className="font-medium">Verifique seu email</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Enviamos suas credenciais de acesso para o email cadastrado. 
              Use-as para fazer seu primeiro login na plataforma SOIA.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Acessar Plataforma
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Se você não receber o email em alguns minutos, verifique sua pasta de spam 
            ou entre em contato conosco.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
