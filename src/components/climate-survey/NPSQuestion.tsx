import { cn } from "@/lib/utils";

interface NPSQuestionProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function NPSQuestion({ value, onChange }: NPSQuestionProps) {
  return (
    <div className="space-y-4">
      <p className="text-foreground font-medium">
        Em uma escala de 0 a 10, o quanto você recomendaria esta empresa como um excelente lugar para trabalhar?
      </p>
      
      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 font-semibold transition-all",
              "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              value === num
                ? num <= 6
                  ? "bg-red-500 text-white border-red-500"
                  : num <= 8
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-green-500 text-white border-green-500"
                : num <= 6
                ? "border-red-300 hover:bg-red-50 text-red-600"
                : num <= 8
                ? "border-yellow-300 hover:bg-yellow-50 text-yellow-600"
                : "border-green-300 hover:bg-green-50 text-green-600"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground px-2">
        <span>Não recomendaria</span>
        <span>Recomendaria totalmente</span>
      </div>
      
      <div className="flex justify-center gap-6 text-xs mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Detratores (0-6)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Neutros (7-8)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Promotores (9-10)</span>
        </div>
      </div>
    </div>
  );
}
