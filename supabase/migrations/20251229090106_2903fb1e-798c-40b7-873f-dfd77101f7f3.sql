-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'partner';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'affiliate';

-- Create licensed_partners table
CREATE TABLE public.licensed_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  endereco_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT (upper(substr(md5(random()::text), 1, 8))),
  contract_url TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  contract_signed_ip TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_contract' CHECK (status IN ('pending_contract', 'pending_approval', 'approved', 'rejected')),
  rejection_reason TEXT,
  first_access_completed BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_representatives table (sócios)
CREATE TABLE public.partner_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.licensed_partners(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  rg TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create affiliates table (pessoa física)
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  rg TEXT NOT NULL,
  estado_civil TEXT NOT NULL,
  profissao TEXT NOT NULL,
  endereco_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL DEFAULT (upper(substr(md5(random()::text), 1, 8))),
  contract_url TEXT,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMP WITH TIME ZONE,
  contract_signed_ip TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_contract' CHECK (status IN ('pending_contract', 'pending_approval', 'approved', 'rejected')),
  rejection_reason TEXT,
  first_access_completed BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partner_prospects table (CRM)
CREATE TABLE public.partner_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.licensed_partners(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'contact', 'negotiation', 'converted', 'lost')),
  notes TEXT,
  converted_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add referral columns to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES public.licensed_partners(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.licensed_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for licensed_partners

-- Anyone can insert (for registration)
CREATE POLICY "Anyone can register as partner"
ON public.licensed_partners FOR INSERT
WITH CHECK (true);

-- Partners can view their own data
CREATE POLICY "Partners can view own data"
ON public.licensed_partners FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Partners can update their own data
CREATE POLICY "Partners can update own data"
ON public.licensed_partners FOR UPDATE
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete partners
CREATE POLICY "Admins can delete partners"
ON public.licensed_partners FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can search approved partners (for referral lookup)
CREATE POLICY "Public can search approved partners"
ON public.licensed_partners FOR SELECT
USING (status = 'approved');

-- RLS Policies for partner_representatives

-- Anyone can insert (during registration)
CREATE POLICY "Anyone can add representatives during registration"
ON public.partner_representatives FOR INSERT
WITH CHECK (true);

-- View representatives of own partner or admin
CREATE POLICY "View own partner representatives"
ON public.partner_representatives FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_representatives.partner_id
    AND (lp.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Update representatives of own partner or admin
CREATE POLICY "Update own partner representatives"
ON public.partner_representatives FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_representatives.partner_id
    AND (lp.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Delete representatives (admin only)
CREATE POLICY "Admins can delete representatives"
ON public.partner_representatives FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for affiliates

-- Anyone can insert (for registration)
CREATE POLICY "Anyone can register as affiliate"
ON public.affiliates FOR INSERT
WITH CHECK (true);

-- Affiliates can view their own data
CREATE POLICY "Affiliates can view own data"
ON public.affiliates FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Affiliates can update their own data
CREATE POLICY "Affiliates can update own data"
ON public.affiliates FOR UPDATE
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete affiliates
CREATE POLICY "Admins can delete affiliates"
ON public.affiliates FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for partner_prospects (CRM)

-- Partners can insert their own prospects
CREATE POLICY "Partners can insert prospects"
ON public.partner_prospects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_prospects.partner_id
    AND lp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Partners can view their own prospects
CREATE POLICY "Partners can view own prospects"
ON public.partner_prospects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_prospects.partner_id
    AND lp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Partners can update their own prospects
CREATE POLICY "Partners can update own prospects"
ON public.partner_prospects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_prospects.partner_id
    AND lp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Partners can delete their own prospects
CREATE POLICY "Partners can delete own prospects"
ON public.partner_prospects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.licensed_partners lp
    WHERE lp.id = partner_prospects.partner_id
    AND lp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create indexes for better performance
CREATE INDEX idx_licensed_partners_cnpj ON public.licensed_partners(cnpj);
CREATE INDEX idx_licensed_partners_status ON public.licensed_partners(status);
CREATE INDEX idx_licensed_partners_referral_code ON public.licensed_partners(referral_code);
CREATE INDEX idx_licensed_partners_user_id ON public.licensed_partners(user_id);

CREATE INDEX idx_affiliates_cpf ON public.affiliates(cpf);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliates_referral_code ON public.affiliates(referral_code);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);

CREATE INDEX idx_partner_representatives_partner_id ON public.partner_representatives(partner_id);

CREATE INDEX idx_partner_prospects_partner_id ON public.partner_prospects(partner_id);
CREATE INDEX idx_partner_prospects_status ON public.partner_prospects(status);

CREATE INDEX idx_companies_referred_by_partner ON public.companies(referred_by_partner_id);
CREATE INDEX idx_companies_referred_by_affiliate ON public.companies(referred_by_affiliate_id);

-- Triggers for updated_at
CREATE TRIGGER update_licensed_partners_updated_at
  BEFORE UPDATE ON public.licensed_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_partner_prospects_updated_at
  BEFORE UPDATE ON public.partner_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();