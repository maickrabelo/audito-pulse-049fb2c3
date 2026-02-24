import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { likertOptions } from "@/data/gptwQuestions";
import { cn } from "@/lib/utils";

interface LikertQuestionProps {
  questionId: string;
  questionText: string;
  questionNumber: number;
  value: number | null;
  onChange: (value: number) => void;
}

export function LikertQuestion({
  questionId,
  questionText,
  questionNumber,
  value,
  onChange
}: LikertQuestionProps) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <div className="mb-4">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          {questionNumber}.
        </span>
        <span className="text-foreground">{questionText}</span>
      </div>
      
      <RadioGroup
        value={value?.toString() || ""}
        onValueChange={(val) => onChange(parseInt(val))}
        className="flex flex-wrap gap-2 md:gap-4"
      >
        {likertOptions.map((option) => (
          <div key={option.value} className="flex items-center">
            <RadioGroupItem
              value={option.value.toString()}
              id={`${questionId}-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${questionId}-${option.value}`}
              className={cn(
                "flex items-center justify-center px-3 py-2 text-xs md:text-sm rounded-lg border cursor-pointer transition-all",
                "hover:bg-primary/10 hover:border-primary",
                value === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border"
              )}
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
