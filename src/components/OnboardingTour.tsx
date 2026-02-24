import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour({ steps, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const el = document.getElementById(step.targetId);
    if (!el) {
      // Element not found, skip to next or complete
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        onComplete();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;

    setHighlightRect({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Position tooltip after a brief delay to allow scroll
    setTimeout(() => {
      const updatedRect = el.getBoundingClientRect();
      const pos = step.position || 'bottom';
      const tooltipWidth = 340;
      const tooltipHeight = 180;
      const gap = 16;

      let style: React.CSSProperties = { position: 'fixed', zIndex: 10001, maxWidth: tooltipWidth };

      switch (pos) {
        case 'bottom':
          style.top = updatedRect.bottom + gap;
          style.left = Math.max(16, Math.min(updatedRect.left, window.innerWidth - tooltipWidth - 16));
          break;
        case 'top':
          style.top = updatedRect.top - tooltipHeight - gap;
          style.left = Math.max(16, Math.min(updatedRect.left, window.innerWidth - tooltipWidth - 16));
          break;
        case 'right':
          style.top = updatedRect.top;
          style.left = updatedRect.right + gap;
          break;
        case 'left':
          style.top = updatedRect.top;
          style.left = updatedRect.left - tooltipWidth - gap;
          break;
      }

      // Ensure tooltip stays in viewport
      if (typeof style.top === 'number') {
        style.top = Math.max(16, Math.min(style.top, window.innerHeight - tooltipHeight - 16));
      }
      if (typeof style.left === 'number') {
        style.left = Math.max(16, Math.min(style.left, window.innerWidth - tooltipWidth - 16));
      }

      setTooltipStyle(style);
    }, 300);
  }, [currentStep, steps, onComplete]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  if (!step || !highlightRect) return null;

  // Create overlay with hole using box-shadow
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: highlightRect.top - window.scrollY,
    left: highlightRect.left,
    width: highlightRect.width,
    height: highlightRect.height,
    zIndex: 10000,
    borderRadius: 8,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    border: '2px solid hsl(var(--primary))',
    pointerEvents: 'none',
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <>
      {/* Overlay with cutout */}
      <div style={overlayStyle} />

      {/* Click blocker behind tooltip but over the overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="bg-white rounded-xl shadow-2xl border border-border p-5 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        {/* Header with skip button */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-bold text-foreground pr-4">{step.title}</h3>
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
            title="Pular tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.description}</p>

        {/* Footer with progress and button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : i < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted-foreground/20'
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {currentStep + 1} de {steps.length}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleNext}
            className="gap-1.5"
          >
            {isLastStep ? (
              <>
                Concluir
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
}