CREATE TABLE public.company_user_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  full_name text,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token_hash text,
  expires_at timestamptz,
  invited_by uuid,
  external_user_id text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX company_user_invites_email_key ON public.company_user_invites (lower(email));
CREATE INDEX company_user_invites_company_idx ON public.company_user_invites (company_id);
CREATE INDEX company_user_invites_token_idx ON public.company_user_invites (token_hash);

GRANT SELECT ON public.company_user_invites TO authenticated;
GRANT ALL ON public.company_user_invites TO service_role;

ALTER TABLE public.company_user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read own company invites"
ON public.company_user_invites FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE TRIGGER t_company_user_invites_upd
BEFORE UPDATE ON public.company_user_invites
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.integration_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  target_url text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  response_status integer,
  response_body text,
  last_attempt_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.integration_webhook_deliveries TO authenticated;
GRANT ALL ON public.integration_webhook_deliveries TO service_role;

ALTER TABLE public.integration_webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read webhook deliveries"
ON public.integration_webhook_deliveries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));