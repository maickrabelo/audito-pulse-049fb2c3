import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft, ArrowRight, Loader2, Users, Building2, CreditCard, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  slug: string;
  min_employees: number;
  max_employees: number | null;
  base_price_cents: number;
  price_per_employee_cents: number | null;
  features: string[];
}

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plano');
  
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [employeeCount, setEmployeeCount] = useState(150);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    email: '',
    phone: '',
    responsibleName: '',
  });
  
  // Partner search states
  const [partners, setPartners] = useState<{ id: string; nome_fantasia: string; cnpj: string; referral_code: string }[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; nome_fantasia: string; cnpj: string; referral_code: string } | null>(null);
  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchPartners();
    // If referral code provided via URL, find the partner
    const refCode = searchParams.get('ref');
    if (refCode) {
      findPartnerByCode(refCode);
    }
  }, []);

  const findPartnerByCode = async (code: string) => {
    try {
      const { data: partner } = await supabase
        .from('licensed_partners')
        .select('id, nome_fantasia, cnpj, referral_code')
        .eq('referral_code', code.toUpperCase())
        .eq('status', 'approved')
        .maybeSingle();

      if (partner) {
        setSelectedPartner(partner);
      }
    } catch (error) {
      console.error('Error finding partner by code:', error);
    }
  };

  const fetchPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const { data, error } = await supabase
        .from('licensed_partners')
        .select('id, nome_fantasia, cnpj, referral_code')
        .eq('status', 'approved')
        .order('nome_fantasia');

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  useEffect(() => {
    if (preselectedPlan && plans.length > 0) {
      const plan = plans.find(p => p.slug === preselectedPlan);
      if (plan) {
        setSelectedPlan(plan);
        if (plan.slug !== 'corporate') {
          setStep(2);
        }
      }
    }
  }, [preselectedPlan, plans]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_employees');

      if (error) throw error;

      const formattedPlans = data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]'),
      }));
      
      setPlans(formattedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const calculatePrice = (plan: Plan) => {
    if (plan.slug === 'corporate' && plan.price_per_employee_cents) {
      const extraEmployees = Math.max(0, employeeCount - 100);
      return plan.base_price_cents + (extraEmployees * plan.price_per_employee_cents);
    }
    return plan.base_price_cents;
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;
    if (field === 'cnpj') formattedValue = formatCNPJ(value);
    if (field === 'phone') formattedValue = formatPhone(value);
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Email válido é obrigatório');
      return false;
    }
    if (!formData.responsibleName.trim()) {
      toast.error('Nome do responsável é obrigatório');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!selectedPlan || !validateForm()) return;

    setIsLoading(true);
    try {
      const effectiveEmployeeCount = selectedPlan.slug === 'corporate' 
        ? employeeCount 
        : selectedPlan.max_employees || selectedPlan.min_employees;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planSlug: selectedPlan.slug,
          employeeCount: effectiveEmployeeCount,
          companyName: formData.companyName,
          companyCnpj: formData.cnpj,
          companyEmail: formData.email,
          companyPhone: formData.phone,
          responsibleName: formData.responsibleName,
          referralCode: selectedPartner?.referral_code || null,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar checkout. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeRangeText = (plan: Plan) => {
    if (plan.max_employees) {
      return `${plan.min_employees} a ${plan.max_employees} colaboradores`;
    }
    return `Acima de ${plan.min_employees - 1} colaboradores`;
  };

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <img 
            src="/lovable-uploads/Logo_SOIA.png" 
            alt="SOIA Logo" 
            className="h-8"
          />
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[
            { num: 1, label: 'Escolha o Plano', icon: Users },
            { num: 2, label: 'Dados da Empresa', icon: Building2 },
            { num: 3, label: 'Pagamento', icon: CreditCard },
          ].map(({ num, label, icon: Icon }) => (
            <div key={num} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">{label}</span>
              </div>
              {num < 3 && (
                <div className={`w-8 h-0.5 mx-2 ${step > num ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Escolha seu plano</h1>
              <p className="text-muted-foreground">Selecione o plano ideal para o tamanho da sua empresa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.slice(0, 4).map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPlan?.id === plan.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getEmployeeRangeText(plan)}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(plan.base_price_cents)}
                      </span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="space-y-2 text-left text-sm">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}

              {/* Corporate Plan - Special Card */}
              {plans.find(p => p.slug === 'corporate') && (
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg md:col-span-2 lg:col-span-3 ${
                    selectedPlan?.slug === 'corporate' 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan(plans.find(p => p.slug === 'corporate')!)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="flex items-center justify-center gap-2">
                      <CardTitle className="text-2xl">Corporate</CardTitle>
                      <Badge variant="secondary">Personalizado</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Acima de 100 colaboradores</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="text-center md:text-left">
                          <span className="text-3xl font-bold text-primary">
                            {formatPrice(calculatePrice(plans.find(p => p.slug === 'corporate')!))}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            R$ 299,90 + R$ 1,00/colaborador acima de 100
                          </p>
                        </div>
                        
                        {selectedPlan?.slug === 'corporate' && (
                          <div className="space-y-2">
                            <Label htmlFor="employeeCount">Quantidade de colaboradores</Label>
                            <Input
                              id="employeeCount"
                              type="number"
                              min={1}
                              placeholder="Ex: 150"
                              value={employeeCount || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                if (!isNaN(value)) {
                                  setEmployeeCount(value);
                                }
                              }}
                              onBlur={() => {
                                if (employeeCount < 101) {
                                  setEmployeeCount(101);
                                }
                              }}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">Mínimo: 101 colaboradores</p>
                          </div>
                        )}
                      </div>
                      
                      <ul className="grid grid-cols-2 gap-2 text-sm">
                        {plans.find(p => p.slug === 'corporate')?.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => setStep(2)} 
                disabled={!selectedPlan}
                className="px-8"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Company Data */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Dados da Empresa</h1>
              <p className="text-muted-foreground">Preencha os dados para criar sua conta</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Plano selecionado: {selectedPlan?.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedPlan?.slug === 'corporate' 
                        ? `${employeeCount} colaboradores`
                        : getEmployeeRangeText(selectedPlan!)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(calculatePrice(selectedPlan!))}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da Empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Nome da sua empresa"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com.br"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                  <Input
                    id="responsibleName"
                    placeholder="Nome completo"
                    value={formData.responsibleName}
                    onChange={(e) => handleInputChange('responsibleName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Empresa que indicou (opcional)</Label>
                  {selectedPartner ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-green-700 dark:text-green-300 font-medium">{selectedPartner.nome_fantasia}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{selectedPartner.cnpj}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPartner(null)}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-800 dark:text-green-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Popover open={partnerSearchOpen} onOpenChange={setPartnerSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={partnerSearchOpen}
                          className="w-full justify-between font-normal text-muted-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            <span>Buscar empresa parceira...</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Digite o nome da empresa..." 
                            value={partnerSearchQuery}
                            onValueChange={setPartnerSearchQuery}
                          />
                          <CommandList>
                            {isLoadingPartners ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                              </div>
                            ) : (
                              <>
                                <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                                <CommandGroup heading="Empresas Parceiras">
                                  {partners
                                    .filter(p => 
                                      p.nome_fantasia.toLowerCase().includes(partnerSearchQuery.toLowerCase())
                                    )
                                    .map((partner) => (
                                      <CommandItem
                                        key={partner.id}
                                        value={partner.nome_fantasia}
                                        onSelect={() => {
                                          setSelectedPartner(partner);
                                          setPartnerSearchOpen(false);
                                          setPartnerSearchQuery('');
                                        }}
                                        className="flex flex-col items-start py-2"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Building2 className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">{partner.nome_fantasia}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground ml-6">{partner.cnpj}</span>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Selecione a empresa que indicou você, se houver
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)}>
                Revisar Pedido
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Payment */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Confirmar Assinatura</h1>
              <p className="text-muted-foreground">Revise os dados antes de prosseguir para o pagamento</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Plano</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium text-lg">{selectedPlan?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPlan?.slug === 'corporate' 
                          ? `${employeeCount} colaboradores`
                          : getEmployeeRangeText(selectedPlan!)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Valor</h3>
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(calculatePrice(selectedPlan!))}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cobrança recorrente mensal
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Dados da Empresa</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p><span className="text-muted-foreground">Empresa:</span> {formData.companyName}</p>
                    {formData.cnpj && <p><span className="text-muted-foreground">CNPJ:</span> {formData.cnpj}</p>}
                    <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                    {formData.phone && <p><span className="text-muted-foreground">Telefone:</span> {formData.phone}</p>}
                    <p><span className="text-muted-foreground">Responsável:</span> {formData.responsibleName}</p>
                    {selectedPartner && (
                      <p className="text-green-600 dark:text-green-400">
                        <span className="text-muted-foreground">Indicado por:</span> {selectedPartner.nome_fantasia} (Parceiro)
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Após o pagamento:</strong> Você receberá um email com suas credenciais de acesso à plataforma SOIA.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                size="lg" 
                onClick={handleCheckout} 
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Pagar com Stripe
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
