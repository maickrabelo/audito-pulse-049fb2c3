import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface OpenQuestionProps {
  questionId: string;
  questionText: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function OpenQuestion({
  questionId,
  questionText,
  value,
  onChange,
  placeholder = "Digite sua resposta aqui..."
}: OpenQuestionProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor={questionId} className="text-foreground font-medium">
        {questionText}
      </Label>
      <Textarea
        id={questionId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-none"
        maxLength={1000}
      />
      <p className="text-xs text-muted-foreground text-right">
        {value.length}/1000 caracteres
      </p>
    </div>
  );
}
