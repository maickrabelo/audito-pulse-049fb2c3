import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const plans = [
  {
    name: 'Starter',
    slug: 'starter',
    employees: 'Até 15 colaboradores',
    price: 'R$ 149,90',
    period: '/mês',
    description: 'Ideal para pequenas empresas',
    features: [
      'Canal de denúncias anônimo',
      'Dashboard básico',
      'Pesquisa de clima organizacional',
      'Relatórios mensais',
      'Suporte por email',
    ],
  },
  {
    name: 'Basic',
    slug: 'basic',
    employees: '16 a 25 colaboradores',
    price: 'R$ 199,90',
    period: '/mês',
    description: 'Para empresas em crescimento',
    features: [
      'Tudo do plano Starter',
      'Dashboard avançado com IA',
      'Análise de sentimento',
      'Relatórios semanais',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Professional',
    slug: 'professional',
    employees: '26 a 50 colaboradores',
    price: 'R$ 249,90',
    period: '/mês',
    description: 'Para médias empresas',
    features: [
      'Tudo do plano Basic',
      'Multi-departamentos',
      'Gestão de SST integrada',
      'API de integração',
      'Treinamento da equipe',
    ],
  },
  {
    name: 'Business',
    slug: 'business',
    employees: '51 a 100 colaboradores',
    price: 'R$ 299,90',
    period: '/mês',
    description: 'Para grandes empresas',
    features: [
      'Tudo do plano Professional',
      'Customização completa',
      'Múltiplas unidades',
      'Relatórios personalizados',
      'Suporte telefônico',
    ],
  },
];

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const navigate = useNavigate();
  const [corporateEmployees, setCorporateEmployees] = useState(150);

  const calculateCorporatePrice = () => {
    const basePrice = 29990; // R$ 299,90 in cents
    const extraEmployees = Math.max(0, corporateEmployees - 100);
    const totalCents = basePrice + (extraEmployees * 100); // R$ 1,00 per employee
    return (totalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSelectPlan = (slug: string) => {
    navigate(`/contratar?plano=${slug}`);
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Investimento
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Valores contratação direto para empresas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quer fazer a gestão de Riscos direto na sua empresa? Confira os planos PJ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border-border hover:border-primary/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.employees}</p>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                
                <ul className="space-y-3 text-left mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.slug)}
                >
                  Contratar agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Corporate Plan */}
        <Card
          className={`transition-all duration-700 hover:shadow-xl border-border hover:border-primary/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-bold text-foreground">
                Corporate
              </CardTitle>
              <Badge variant="secondary">Personalizado</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Acima de 100 colaboradores</p>
          </CardHeader>
          
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="text-center md:text-left">
                  <span className="text-4xl font-bold text-primary">{calculateCorporatePrice()}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                  <p className="text-sm text-muted-foreground mt-2">
                    R$ 299,90 + R$ 1,00 por colaborador acima de 100
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="corporate-employees" className="text-sm font-medium text-foreground">
                    Quantidade de colaboradores:
                  </label>
                  <Input
                    id="corporate-employees"
                    type="number"
                    min={1}
                    value={corporateEmployees || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      if (!isNaN(value)) {
                        setCorporateEmployees(value);
                      }
                    }}
                    onBlur={() => {
                      if (corporateEmployees < 101) {
                        setCorporateEmployees(101);
                      }
                    }}
                    className="text-center text-lg font-semibold"
                    placeholder="Digite a quantidade"
                  />
                  <p className="text-xs text-muted-foreground">Mínimo de 101 colaboradores</p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => handleSelectPlan('corporate')}
                >
                  Contratar agora
                </Button>
              </div>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Tudo do plano Business',
                  'Colaboradores ilimitados',
                  'Gerente de conta dedicado',
                  'SLA garantido',
                  'Onboarding personalizado',
                  'Consultoria de compliance',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className={`text-center mt-8 space-y-4 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="lg"
            onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de solicitar uma demonstração do SOIA.', '_blank')}
            className="px-8"
          >
            Solicitar Demonstração
          </Button>
          <p className="text-sm text-muted-foreground">
            * Fale com nosso time comercial pelo WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
