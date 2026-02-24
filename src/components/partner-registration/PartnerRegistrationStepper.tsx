import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerRegistrationStepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: "Dados da Empresa" },
  { number: 2, title: "Sócios/Representantes" },
  { number: 3, title: "Contrato" },
  { number: 4, title: "Conclusão" },
];

const PartnerRegistrationStepper = ({ currentStep }: PartnerRegistrationStepperProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                currentStep > step.number
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.number
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.number ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                "text-xs mt-2 text-center hidden sm:block",
                currentStep >= step.number
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-1 mx-2 rounded-full transition-all",
                currentStep > step.number ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default PartnerRegistrationStepper;
