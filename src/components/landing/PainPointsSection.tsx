import React from 'react';
import { AlertTriangle, Scale, Users, TrendingDown } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const painPoints = [
  {
    icon: Scale,
    title: 'Processos Trabalhistas',
    description: 'Casos de assédio e riscos psicossociais não reportados podem resultar em processos milionários e danos irreparáveis à empresa.',
    stat: 'R$ 50mi+',
    statLabel: 'em indenizações/ano no Brasil'
  },
  {
    icon: AlertTriangle,
    title: 'Multas por NR-01',
    description: 'A NR-01 exige o levantamento de riscos psicossociais. O não cumprimento gera multas pesadas e interdições.',
    stat: 'R$ 6.708',
    statLabel: 'a R$ 6,7 milhões por infração'
  },
  {
    icon: Users,
    title: 'Perda de Talentos',
    description: 'Ambientes com riscos psicossociais não gerenciados causam alta rotatividade. Substituir um funcionário custa até 200% do salário.',
    stat: '87%',
    statLabel: 'deixam por cultura ruim'
  },
  {
    icon: TrendingDown,
    title: 'Danos Reputacionais',
    description: 'Escândalos de assédio e falta de gestão de riscos psicossociais destroem a imagem da empresa em horas.',
    stat: '66%',
    statLabel: 'perdem valor de mercado'
  },
];

const PainPointsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="riscos-psicossociais" className="py-20 bg-muted/50" aria-label="Riscos psicossociais que a NR-01 exige gerenciar">
      <div className="audit-container" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-audit-secondary font-semibold text-sm uppercase tracking-wider">Riscos Psicossociais</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Riscos psicossociais que sua empresa precisa gerenciar
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Sem um sistema NR-01 eficiente para levantamento de riscos psicossociais, problemas graves passam despercebidos até se tornarem crises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {painPoints.map((point, idx) => (
            <div 
              key={idx} 
              className={`bg-card rounded-xl p-6 border border-destructive/20 hover:border-destructive/40 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isVisible ? `${idx * 100 + 200}ms` : '0ms' }}
            >
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <point.icon className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{point.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{point.description}</p>
              <div className="pt-4 border-t border-border">
                <div className="text-2xl font-bold text-destructive">{point.stat}</div>
                <div className="text-xs text-muted-foreground">{point.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
