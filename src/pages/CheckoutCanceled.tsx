import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const CheckoutCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pagamento Cancelado
            </h1>
            <p className="text-muted-foreground">
              O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
            </p>
          </div>

          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Se você encontrou algum problema durante o checkout ou tem dúvidas sobre nossos planos, 
              nossa equipe está pronta para ajudar.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              size="lg" 
              onClick={() => navigate('/contratar')}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Precisa de ajuda? Entre em contato: contato@soia.com.br
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutCanceled;
