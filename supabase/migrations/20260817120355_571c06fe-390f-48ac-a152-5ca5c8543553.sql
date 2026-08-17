CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  subtitle text,
  effective_date date NOT NULL,
  content text NOT NULL,
  content_hash text NOT NULL,
  summary text,
  declarations jsonb NOT NULL DEFAULT '[]'::jsonb,
  audience text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, version)
);

CREATE UNIQUE INDEX legal_documents_active_code ON public.legal_documents (code) WHERE is_active;

GRANT SELECT ON public.legal_documents TO anon;
GRANT SELECT ON public.legal_documents TO authenticated;
GRANT ALL ON public.legal_documents TO service_role;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read the privacy notice"
  ON public.legal_documents FOR SELECT TO anon
  USING (code = 'DOC04_AVISO_PRIVACIDADE');

CREATE POLICY "Authenticated users can read legal documents"
  ON public.legal_documents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "AMO team manages legal documents"
  ON public.legal_documents FOR ALL TO authenticated
  USING (public.is_amo_team(auth.uid()))
  WITH CHECK (public.is_amo_team(auth.uid()));

CREATE TRIGGER t_legal_documents_upd
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  sst_manager_id uuid REFERENCES public.sst_managers(id) ON DELETE SET NULL,
  role text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id),
  document_code text NOT NULL,
  document_version text NOT NULL,
  document_title text NOT NULL,
  document_effective_date date NOT NULL,
  document_hash text NOT NULL,
  declarations jsonb NOT NULL DEFAULT '[]'::jsonb,
  result text NOT NULL CHECK (result IN ('accepted','refused')),
  reason text,
  ip text,
  user_agent text,
  session_id text,
  timezone text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX legal_acceptances_user_idx ON public.legal_acceptances (user_id, document_code, accepted_at DESC);

GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;

ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own acceptances"
  ON public.legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "AMO team reads all acceptances"
  ON public.legal_acceptances FOR SELECT TO authenticated
  USING (public.is_amo_team(auth.uid()));

CREATE TABLE public.case_conflict_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_role text,
  has_conflict boolean NOT NULL,
  justification text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

CREATE INDEX case_conflict_user_idx ON public.case_conflict_declarations (user_id, report_id);

GRANT SELECT, INSERT ON public.case_conflict_declarations TO authenticated;
GRANT ALL ON public.case_conflict_declarations TO service_role;

ALTER TABLE public.case_conflict_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own conflict declarations"
  ON public.case_conflict_declarations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "AMO team reads all conflict declarations"
  ON public.case_conflict_declarations FOR SELECT TO authenticated
  USING (public.is_amo_team(auth.uid()));

CREATE POLICY "Users record their own conflict declaration"
  ON public.case_conflict_declarations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS privacy_notice_version text,
  ADD COLUMN IF NOT EXISTS privacy_notice_hash text;