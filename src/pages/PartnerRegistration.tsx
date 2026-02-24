import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PartnerRegistrationStepper from "@/components/partner-registration/PartnerRegistrationStepper";
import CompanyDataStep from "@/components/partner-registration/CompanyDataStep";
import RepresentativesStep from "@/components/partner-registration/RepresentativesStep";
import ContractStep from "@/components/partner-registration/ContractStep";
import SuccessStep from "@/components/partner-registration/SuccessStep";

export interface PartnerFormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  enderecoCompleto: string;
  email: string;
  phone: string;
}

export interface Representative {
  id: string;
  nome: string;
  cpf: string;
  rg: string;
  isPrimary: boolean;
}

const PartnerRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [partnerData, setPartnerData] = useState<PartnerFormData>({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    enderecoCompleto: "",
    email: "",
    phone: "",
  });
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePartnerDataSubmit = (data: PartnerFormData) => {
    setPartnerData(data);
    handleNextStep();
  };

  const handleRepresentativesSubmit = (reps: Representative[], id: string) => {
    setRepresentatives(reps);
    setPartnerId(id);
    handleNextStep();
  };

  const handleContractSigned = (url: string) => {
    setContractUrl(url);
    handleNextStep();
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
              Cadastro de Parceiro Licenciado
            </CardTitle>
            <CardDescription>
              Preencha os dados para se tornar um parceiro licenciado SOIA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PartnerRegistrationStepper currentStep={currentStep} />

            <div className="mt-8">
              {currentStep === 1 && (
                <CompanyDataStep
                  initialData={partnerData}
                  onSubmit={handlePartnerDataSubmit}
                />
              )}
              {currentStep === 2 && (
                <RepresentativesStep
                  partnerData={partnerData}
                  initialRepresentatives={representatives}
                  onSubmit={handleRepresentativesSubmit}
                  onBack={handlePrevStep}
                />
              )}
              {currentStep === 3 && partnerId && (
                <ContractStep
                  partnerId={partnerId}
                  partnerData={partnerData}
                  representatives={representatives}
                  onContractSigned={handleContractSigned}
                  onBack={handlePrevStep}
                />
              )}
              {currentStep === 4 && (
                <SuccessStep partnerEmail={partnerData.email} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerRegistration;
