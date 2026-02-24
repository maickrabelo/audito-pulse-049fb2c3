import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Mail, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SuccessStepProps {
  partnerEmail: string;
}

const SuccessStep = ({ partnerEmail }: SuccessStepProps) => {
  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-primary mb-2">
          Cadastro Realizado com Sucesso!
        </h3>
        <p className="text-muted-foreground">
          Seu cadastro como Parceiro Licenciado foi enviado para análise.
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold">Confirmação por Email</h4>
              <p className="text-sm text-muted-foreground">
                Enviamos um email de confirmação para{" "}
                <strong className="text-foreground">{partnerEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold">Análise em Andamento</h4>
              <p className="text-sm text-muted-foreground">
                Nossa equipe irá analisar sua solicitação em até 48 horas úteis.
                Você receberá um email com o resultado da análise.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Após a aprovação, você receberá suas credenciais de acesso ao sistema.
        </p>
        <Link to="/">
          <Button>
            Voltar ao Início
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SuccessStep;
