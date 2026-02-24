import React from 'react';
import { Rocket, MessageSquare, Cpu, BarChart, CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const steps = [
  {
    icon: Rocket,
    title: 'Implementação Rápida',
    description: 'Configuramos sua plataforma em até 48h com total suporte.',
    color: 'bg-blue-500'
  },
  {
    icon: MessageSquare,
    title: 'Colaboradores Utilizam',
    description: 'Canal disponível 24/7 para denúncias anônimas e pesquisas de clima.',
    color: 'bg-green-500'
  },
  {
    icon: Cpu,
    title: 'IA Processa',
    description: 'Inteligência artificial classifica, prioriza e identifica padrões.',
    color: 'bg-purple-500'
  },
  {
    icon: BarChart,
    title: 'Gestores Recebem Insights',
    description: 'Dashboard com métricas, alertas e recomendações acionáveis.',
    color: 'bg-orange-500'
  },
  {
    icon: CheckCircle2,
    title: 'Ações São Tomadas',
    description: 'Resolução de casos e melhoria contínua da cultura organizacional.',
    color: 'bg-emerald-500'
  },
];

const HowItWorksSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="como-funciona" className="py-20 bg-muted/30" aria-label="Como funciona o sistema NR-01 de riscos psicossociais">
      <div className="audit-container" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-audit-secondary font-semibold text-sm uppercase tracking-wider">Processo</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Como funciona
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Um processo simples e eficiente para transformar a cultura da sua organização.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className={`hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-border to-transparent transition-all duration-1000 ${isVisible ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}`} />
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div 
                key={idx} 
                className={`relative text-center group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: isVisible ? `${idx * 150 + 200}ms` : '0ms' }}
              >
                {/* Step number */}
                <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center lg:left-1/2 lg:-translate-x-1/2 lg:-top-4 transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-0'}`}
                  style={{ transitionDelay: isVisible ? `${idx * 150 + 400}ms` : '0ms' }}
                >
                  {idx + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl ${step.color} mx-auto flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
