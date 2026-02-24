-- =====================================================
-- CORREÇÃO DE SEGURANÇA LGPD - Proteção de Dados Pessoais
-- =====================================================

-- 1. COMPANIES: Criar view pública que expõe apenas campos seguros
-- =====================================================

-- Criar view pública para companies (apenas nome e slug)
CREATE VIEW public.companies_public
WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  logo_url
FROM public.companies;

-- Remover política pública permissiva da tabela companies
DROP POLICY IF EXISTS "Public can view company basics for reports" ON public.companies;

-- Criar nova política restritiva - público só pode ver via view
CREATE POLICY "Public can view company basics via view only"
ON public.companies
FOR SELECT
USING (
  -- Permite apenas usuários autenticados com roles específicas
  -- ou acesso via service role (para a view)
  auth.uid() IS NOT NULL
  OR (current_setting('role', true) = 'service_role')
);

-- Permitir SELECT na view para anônimos
GRANT SELECT ON public.companies_public TO anon;
GRANT SELECT ON public.companies_public TO authenticated;

-- 2. REPORTS: Criar view pública que oculta dados do denunciante
-- =====================================================

-- Criar view pública para reports (sem dados pessoais do denunciante)
CREATE VIEW public.reports_public
WITH (security_invoker = on) AS
SELECT 
  id,
  tracking_code,
  status,
  category,
  title,
  created_at,
  updated_at,
  company_id,
  is_anonymous,
  urgency,
  department
  -- Excluídos: reporter_name, reporter_email, reporter_phone, description, ai_summary
FROM public.reports
WHERE tracking_code IS NOT NULL;

-- Remover política pública permissiva da tabela reports
DROP POLICY IF EXISTS "Public can view reports by tracking code" ON public.reports;

-- Criar nova política que NÃO permite acesso público direto aos dados sensíveis
CREATE POLICY "Public can view reports via tracking code (safe fields only)"
ON public.reports
FOR SELECT
USING (
  -- Usuários autenticados com permissões podem ver tudo
  (has_role(auth.uid(), 'admin'::app_role))
  OR (has_role(auth.uid(), 'company'::app_role) AND EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = reports.company_id
  ))
  OR (has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = reports.company_id
  ))
  -- Acesso público apenas via service role (para a view)
  OR (current_setting('role', true) = 'service_role')
);

-- Permitir SELECT na view para anônimos (para acompanhamento de denúncia)
GRANT SELECT ON public.reports_public TO anon;
GRANT SELECT ON public.reports_public TO authenticated;

-- 3. Adicionar comentários de documentação LGPD
-- =====================================================

COMMENT ON VIEW public.companies_public IS 'View pública LGPD-compliant: expõe apenas dados não-sensíveis das empresas (nome, slug, logo)';
COMMENT ON VIEW public.reports_public IS 'View pública LGPD-compliant: permite acompanhamento de denúncia sem expor dados do denunciante';

COMMENT ON TABLE public.reports IS 'Tabela de denúncias - contém dados pessoais sensíveis (nome, email, telefone do denunciante) protegidos por RLS';
COMMENT ON TABLE public.companies IS 'Tabela de empresas - contém dados empresariais (CNPJ, emails de notificação) protegidos por RLS';