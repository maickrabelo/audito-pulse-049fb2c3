import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SurveyProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { name: string; completed: boolean }[];
}

export function SurveyProgress({ currentStep, totalSteps, steps }: SurveyProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% concluído
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center min-w-[80px] text-center",
              index + 1 === currentStep
                ? "text-primary"
                : step.completed
                ? "text-green-600"
                : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1",
                index + 1 === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step.completed
                  ? "bg-green-100 text-green-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs hidden md:block">{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
