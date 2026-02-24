import React from 'react';
import { MessageSquareWarning, BarChart3, Brain, LayoutDashboard, ShieldCheck, FileText, Flame, HeartPulse } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  {
    icon: MessageSquareWarning,
    title: 'Canal de Denúncias',
    description: 'Chat inteligente que guia o colaborador a relatar situações com segurança e anonimato garantido.',
    highlights: ['100% anônimo', 'Chat com IA', 'Código de rastreio']
  },
  {
    icon: BarChart3,
    title: 'Pesquisa de Clima',
    description: 'Questionários personalizáveis com análise NPS para medir o pulso da organização e identificar riscos psicossociais.',
    highlights: ['Personalizável', 'Análise NPS', 'Relatórios detalhados']
  },
  {
    icon: Brain,
    title: 'Análise com IA',
    description: 'Inteligência artificial classifica, prioriza e identifica padrões nos riscos psicossociais reportados.',
    highlights: ['Classificação automática', 'Priorização', 'Detecção de padrões']
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard Analítico',
    description: 'Visualize métricas de riscos psicossociais em tempo real, tendências e indicadores de risco organizacional.',
    highlights: ['Tempo real', 'Gráficos interativos', 'Exportação de dados']
  },
  {
    icon: ShieldCheck,
    title: 'Compliance NR-01',
    description: 'Sistema NR-01 completo para levantamento, avaliação e gestão de riscos psicossociais conforme a norma regulamentadora.',
    highlights: ['Levantamento NR-01', 'Documentação', 'Auditoria']
  },
  {
    icon: FileText,
    title: 'Relatórios Automáticos',
    description: 'Gere relatórios de riscos psicossociais para auditorias, reuniões e tomada de decisões estratégicas.',
    highlights: ['PDF/Excel', 'Personalizáveis', 'Agendamento']
  },
  {
    icon: Flame,
    title: 'Avaliação de Burnout',
    description: 'Questionários cientificamente validados para medir exaustão, despersonalização e realização profissional.',
    highlights: ['Validado cientificamente', 'Relatório PDF', 'Dashboard']
  },
  {
    icon: HeartPulse,
    title: 'Riscos Psicossociais (HSEIT)',
    description: 'Levantamento de riscos psicossociais com 35 indicadores em 7 categorias, com plano de ação conforme NR-01.',
    highlights: ['7 categorias', 'Plano de ação', 'Conforme NR-01']
  },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="sistema-nr01" className="py-20 bg-background" aria-label="Sistema NR-01 completo para gestão de riscos psicossociais">
      <div className="audit-container" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-audit-secondary font-semibold text-sm uppercase tracking-wider">Sistema NR-01</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-3 mb-4">
            Sistema completo para gestão de riscos psicossociais
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            O SOIA integra canal de denúncias, pesquisa de clima, avaliação de burnout, levantamento de riscos psicossociais e compliance NR-01 em uma solução completa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className={`bg-card rounded-xl p-8 border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: isVisible ? `${idx * 100 + 200}ms` : '0ms' }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-6 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground mb-6">{feature.description}</p>
              <div className="flex flex-wrap gap-2">
                {feature.highlights.map((highlight, hIdx) => (
                  <span 
                    key={hIdx}
                    className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
