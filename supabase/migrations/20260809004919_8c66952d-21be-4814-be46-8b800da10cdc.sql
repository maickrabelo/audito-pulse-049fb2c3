
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_company_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
    AND role::text IN ('company','apurador','comite','dpo','visualizador')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _company_id IS NOT NULL
     AND public.get_user_company_id(_user_id) = _company_id
     AND public.get_company_role(_user_id) IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.is_company_principal(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_company_role(_user_id) = 'company'
$$;

CREATE OR REPLACE FUNCTION public.can_company_write(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_company_member(_user_id, _company_id)
     AND public.get_company_role(_user_id) IN ('company','apurador','comite')
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_company_id(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_company_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_company_principal(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_company_write(uuid, uuid) FROM anon;

-- reports
DROP POLICY IF EXISTS "Companies can view their own reports" ON public.reports;
CREATE POLICY "Company members can view their company reports"
ON public.reports FOR SELECT TO authenticated
USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Companies can update their own reports" ON public.reports;
CREATE POLICY "Company writers can update their company reports"
ON public.reports FOR UPDATE TO authenticated
USING (public.can_company_write(auth.uid(), company_id))
WITH CHECK (public.can_company_write(auth.uid(), company_id));

-- report_attachments
DROP POLICY IF EXISTS "Companies can view their report attachments" ON public.report_attachments;
CREATE POLICY "Company members can view their report attachments"
ON public.report_attachments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.reports r
  WHERE r.id = report_attachments.report_id
    AND public.is_company_member(auth.uid(), r.company_id)
));

-- report_updates
CREATE POLICY "Company writers can insert updates"
ON public.report_updates FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = report_updates.report_id
      AND public.can_company_write(auth.uid(), r.company_id)
  )
);

CREATE POLICY "Company members can view updates of their reports"
ON public.report_updates FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.reports r
  WHERE r.id = report_updates.report_id
    AND public.is_company_member(auth.uid(), r.company_id)
));

-- profiles: principal sees its company's users
CREATE POLICY "Company principal can view company profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.is_company_principal(auth.uid())
  AND company_id IS NOT NULL
  AND company_id = public.get_user_company_id(auth.uid())
);

-- user_roles: principal sees roles of its company's users
CREATE POLICY "Company principal can view company user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (
  public.is_company_principal(auth.uid())
  AND public.get_user_company_id(user_id) IS NOT NULL
  AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid())
);
