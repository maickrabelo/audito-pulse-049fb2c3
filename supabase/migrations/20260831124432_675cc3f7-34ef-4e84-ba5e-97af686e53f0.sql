CREATE TABLE public.internal_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  cpf text NOT NULL,
  email text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_users TO authenticated;
GRANT ALL ON public.internal_users TO service_role;

ALTER TABLE public.internal_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only master can manage internal users"
ON public.internal_users FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER internal_users_updated_at
BEFORE UPDATE ON public.internal_users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Acesso dos triadores internos
CREATE POLICY "Triadores can view all reports"
ON public.reports FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'triador_sst'::app_role));

CREATE POLICY "Triadores can update reports"
ON public.reports FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'triador_sst'::app_role))
WITH CHECK (has_role(auth.uid(), 'triador_sst'::app_role));

CREATE POLICY "Triadores can view companies"
ON public.companies FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'triador_sst'::app_role));
