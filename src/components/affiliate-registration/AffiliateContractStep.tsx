import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileCheck, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateFormData } from "@/pages/AffiliateRegistration";

interface AffiliateContractStepProps {
  affiliateId: string;
  affiliateData: AffiliateFormData;
  onContractSigned: () => void;
  onBack: () => void;
}

const AffiliateContractStep = ({
  affiliateId,
  affiliateData,
  onContractSigned,
  onBack,
}: AffiliateContractStepProps) => {
  const [contractHtml, setContractHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateContract();
  }, [affiliateId]);

  const generateContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-partner-contract", {
        body: { partnerId: affiliateId, type: "affiliate" },
      });

      if (error) throw error;
      if (!data?.contractHtml) throw new Error("Contrato não gerado");

      setContractHtml(data.contractHtml);
    } catch (err: any) {
      console.error("Error generating contract:", err);
      setError(err.message || "Erro ao gerar contrato");
      toast.error("Erro ao gerar contrato");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      toast.error("Aceite os termos para continuar");
      return;
    }

    setIsSigning(true);
    try {
      const { error } = await supabase.functions.invoke("sign-contract", {
        body: { partnerId: affiliateId, type: "affiliate" },
      });

      if (error) throw error;

      toast.success("Contrato assinado com sucesso!");
      onContractSigned();
    } catch (err: any) {
      console.error("Error signing contract:", err);
      toast.error(err.message || "Erro ao assinar contrato");
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Gerando contrato...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={generateContract}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Contrato de Afiliação</h3>
        <p className="text-sm text-muted-foreground">
          Leia atentamente o contrato antes de assinar
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contrato de Afiliação SOIA</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            {contractHtml ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: contractHtml }}
              />
            ) : (
              <p className="text-muted-foreground">Contrato não disponível</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Li e aceito os termos do contrato
              </label>
              <p className="text-sm text-muted-foreground">
                Declaro que li integralmente o contrato de afiliação e concordo com
                todos os termos estabelecidos.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Aceito a Política de Privacidade
              </label>
              <p className="text-sm text-muted-foreground">
                Concordo com o tratamento dos meus dados pessoais conforme a LGPD.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Assinatura digital em nome de:{" "}
              <strong className="text-foreground">{affiliateData.nomeCompleto}</strong>
              <br />
              CPF: {affiliateData.cpf}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSignContract}
          disabled={isSigning || !acceptedTerms || !acceptedPrivacy}
        >
          {isSigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assinando...
            </>
          ) : (
            <>
              <FileCheck className="mr-2 h-4 w-4" />
              Assinar Contrato
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AffiliateContractStep;
