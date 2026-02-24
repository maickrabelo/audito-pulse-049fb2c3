import React from 'react';
import { TrendingUp, Clock, Shield, Eye, CheckCircle, Award } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const benefits = [
  {
    icon: TrendingUp,
    title: 'Reduza riscos em até 70%',
    description: 'Identificação precoce de problemas evita que se tornem processos trabalhistas.'
  },
  {
    icon: Shield,
    title: 'Conformidade total com NR-01',
    description: 'Gestão de riscos psicossociais documentada e auditável.'
  },
  {
    icon: Clock,
    title: 'Implementação em 48h',
    description: 'Plataforma pronta para uso em até 2 dias úteis, sem complexidade.'
  },
  {
    icon: Eye,
    title: 'Visibilidade completa',
    description: 'Dashboards em tempo real para decisões baseadas em dados.'
  },
  {
    icon: CheckCircle,
    title: 'Canal seguro e anônimo',
    description: 'Colaboradores se sentem seguros para reportar problemas.'
  },
  {
    icon: Award,
    title: 'Melhore a cultura',
    description: 'Transforme feedback em ações concretas para um ambiente melhor.'
  },
];

const BenefitsSection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="beneficios" className="py-20 bg-gradient-to-br from-audit-primary to-audit-dark text-white" aria-label="Benefícios do sistema NR-01 para gestão de riscos psicossociais">
      <div className="audit-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div ref={leftRef} className={`transition-all duration-700 ${leftVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <span className="text-audit-secondary font-semibold text-sm uppercase tracking-wider">Benefícios</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">
              Por que escolher o SOIA?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Uma solução completa que protege sua empresa, cuida dos colaboradores e garante conformidade com as normas regulamentadoras.
            </p>
            
            <div className="space-y-6">
              {benefits.slice(0, 3).map((benefit, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-4 transition-all duration-500 ${leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: leftVisible ? `${idx * 150 + 300}ms` : '0ms' }}
                >
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-audit-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-white/60 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div ref={rightRef} className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700 ${rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            {benefits.slice(3).map((benefit, idx) => (
              <div 
                key={idx} 
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-500 ${rightVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ transitionDelay: rightVisible ? `${idx * 100 + 200}ms` : '0ms' }}
              >
                <div className="w-10 h-10 rounded-lg bg-audit-secondary/20 flex items-center justify-center mb-4">
                  <benefit.icon className="h-5 w-5 text-audit-secondary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-white/60 text-sm">{benefit.description}</p>
              </div>
            ))}
            
            {/* Highlight card */}
            <div className={`sm:col-span-2 bg-gradient-to-r from-audit-secondary/20 to-audit-accent/20 rounded-xl p-6 border border-audit-secondary/30 transition-all duration-700 ${rightVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              style={{ transitionDelay: rightVisible ? '500ms' : '0ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-audit-secondary">ROI</div>
                <div>
                  <div className="text-2xl font-bold">300%+</div>
                  <div className="text-white/60 text-sm">Retorno médio sobre investimento no primeiro ano</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
