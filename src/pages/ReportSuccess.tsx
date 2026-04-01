import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ReportSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const trackingCode = location.state?.trackingCode || 'N/A';

  const copyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    toast({ title: "Código copiado!", description: "O código foi copiado para a área de transferência." });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-lg w-full shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Denúncia Registrada com Sucesso</h1>
              <p className="text-muted-foreground">
                Sua denúncia foi registrada de forma anônima e será tratada com total atenção e sigilo pelo setor responsável.
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Seu código de acompanhamento:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary tracking-wider">{trackingCode}</span>
                <Button variant="ghost" size="icon" onClick={copyCode} title="Copiar código">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Guarde este código. Ele é a única forma de acompanhar o andamento da sua denúncia.
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              Através deste código você poderá consultar o status da sua denúncia a qualquer momento, sem precisar se identificar.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <Button onClick={() => navigate('/', { state: { openTrackModal: true, trackingCode } })} className="w-full gap-2">
                <Search className="h-4 w-4" />
                Acompanhar Denúncia
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Voltar à Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ReportSuccess;
