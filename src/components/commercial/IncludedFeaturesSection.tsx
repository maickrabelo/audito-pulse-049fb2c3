import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const features = [
  { name: 'Canal de denúncias anônimo', starter: true, pro: true, enterprise: true, corporate: true },
  { name: 'Pesquisa de clima organizacional', starter: true, pro: true, enterprise: true, corporate: true },
  { name: 'Dashboard de gestão', starter: true, pro: true, enterprise: true, corporate: true },
  { name: 'Relatórios básicos', starter: true, pro: true, enterprise: true, corporate: true },
  { name: 'Análise com IA', starter: false, pro: true, enterprise: true, corporate: true },
  { name: 'Múltiplos departamentos', starter: false, pro: false, enterprise: true, corporate: true },
  { name: 'Integração SST', starter: false, pro: false, enterprise: true, corporate: true },
  { name: 'API de integração', starter: false, pro: false, enterprise: true, corporate: true },
  { name: 'Customização completa', starter: false, pro: false, enterprise: false, corporate: true },
  { name: 'Gerente de conta dedicado', starter: false, pro: false, enterprise: false, corporate: true },
  { name: 'SLA garantido', starter: false, pro: false, enterprise: false, corporate: true },
];

const IncludedFeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Comparativo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            O que está incluso em cada plano
          </h2>
        </div>

        <div className={`overflow-x-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 font-semibold text-foreground">Funcionalidade</th>
                <th className="text-center py-4 px-4 font-semibold text-foreground">Starter</th>
                <th className="text-center py-4 px-4 font-semibold text-primary">Profissional</th>
                <th className="text-center py-4 px-4 font-semibold text-foreground">Empresarial</th>
                <th className="text-center py-4 px-4 font-semibold text-foreground">Corporativo</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr 
                  key={feature.name} 
                  className={`border-b border-border/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td className="py-3 px-4 text-foreground">{feature.name}</td>
                  <td className="text-center py-3 px-4">
                    {feature.starter ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-4 bg-primary/5">
                    {feature.pro ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    {feature.enterprise ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                  <td className="text-center py-3 px-4">
                    {feature.corporate ? (
                      <Check className="w-5 h-5 text-primary mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default IncludedFeaturesSection;
