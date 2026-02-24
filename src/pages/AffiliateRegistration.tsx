import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AffiliateRegistrationStepper from "@/components/affiliate-registration/AffiliateRegistrationStepper";
import PersonalDataStep from "@/components/affiliate-registration/PersonalDataStep";
import AffiliateContractStep from "@/components/affiliate-registration/AffiliateContractStep";
import AffiliateSuccessStep from "@/components/affiliate-registration/AffiliateSuccessStep";

export interface AffiliateFormData {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  estadoCivil: string;
  profissao: string;
  enderecoCompleto: string;
  email: string;
  phone: string;
}

const AffiliateRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [affiliateData, setAffiliateData] = useState<AffiliateFormData>({
    nomeCompleto: "",
    cpf: "",
    rg: "",
    estadoCivil: "",
    profissao: "",
    enderecoCompleto: "",
    email: "",
    phone: "",
  });
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePersonalDataSubmit = (data: AffiliateFormData, id: string) => {
    setAffiliateData(data);
    setAffiliateId(id);
    handleNextStep();
  };

  const handleContractSigned = () => {
    handleNextStep();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Cadastro de Afiliado
            </CardTitle>
            <CardDescription>
              Torne-se um afiliado SOIA e ganhe comissões por indicações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AffiliateRegistrationStepper currentStep={currentStep} />

            <div className="mt-8">
              {currentStep === 1 && (
                <PersonalDataStep
                  initialData={affiliateData}
                  onSubmit={handlePersonalDataSubmit}
                />
              )}
              {currentStep === 2 && affiliateId && (
                <AffiliateContractStep
                  affiliateId={affiliateId}
                  affiliateData={affiliateData}
                  onContractSigned={handleContractSigned}
                  onBack={handlePrevStep}
                />
              )}
              {currentStep === 3 && (
                <AffiliateSuccessStep affiliateEmail={affiliateData.email} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateRegistration;
