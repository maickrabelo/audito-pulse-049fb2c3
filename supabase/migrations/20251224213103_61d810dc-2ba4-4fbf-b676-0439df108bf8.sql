-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  min_employees integer NOT NULL,
  max_employees integer,
  base_price_cents integer NOT NULL,
  price_per_employee_cents integer,
  stripe_price_id text,
  stripe_product_id text,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.subscription_plans(id) NOT NULL,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL DEFAULT 'pending',
  employee_count integer NOT NULL,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add subscription fields to companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS max_employees integer;

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans (public read)
CREATE POLICY "Anyone can view active plans" 
ON public.subscription_plans 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage plans" 
ON public.subscription_plans 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for subscriptions
CREATE POLICY "Companies can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'company') AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = subscriptions.company_id
  )
);

CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert the 5 plans
INSERT INTO public.subscription_plans (name, slug, min_employees, max_employees, base_price_cents, price_per_employee_cents, features) VALUES
('Starter', 'starter', 1, 15, 14990, NULL, '["Canal de denúncias anônimo", "Dashboard básico", "Pesquisa de clima organizacional", "Relatórios mensais", "Suporte por email"]'::jsonb),
('Basic', 'basic', 16, 25, 19990, NULL, '["Tudo do plano Starter", "Dashboard avançado com IA", "Análise de sentimento", "Relatórios semanais", "Suporte prioritário"]'::jsonb),
('Professional', 'professional', 26, 50, 24990, NULL, '["Tudo do plano Basic", "Multi-departamentos", "Gestão de SST integrada", "API de integração", "Treinamento da equipe"]'::jsonb),
('Business', 'business', 51, 100, 29990, NULL, '["Tudo do plano Professional", "Customização completa", "Múltiplas unidades", "Relatórios personalizados", "Suporte telefônico"]'::jsonb),
('Corporate', 'corporate', 101, NULL, 29990, 100, '["Tudo do plano Business", "Colaboradores ilimitados", "Gerente de conta dedicado", "SLA garantido", "Onboarding personalizado", "Consultoria de compliance"]'::jsonb);

-- Create updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();