
-- 1. Enum de classificação
DO $$ BEGIN
  CREATE TYPE public.report_classification AS ENUM ('pending_ai','4A_sst','4B_out_of_scope','4C_mixed','4D_grave_immediate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Estende app_role
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'apurador';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'comite';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dpo';
EXCEPTION WHEN others THEN NULL; END $$;

-- 3. Extensões em reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS ai_classification public.report_classification DEFAULT 'pending_ai',
  ADD COLUMN IF NOT EXISTS ai_classification_rationale text,
  ADD COLUMN IF NOT EXISTS amo_validated_classification public.report_classification,
  ADD COLUMN IF NOT EXISTS amo_validated_by uuid,
  ADD COLUMN IF NOT EXISTS amo_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS amo_validation_notes text,
  ADD COLUMN IF NOT EXISTS snapshot_unidade text,
  ADD COLUMN IF NOT EXISTS snapshot_ghe text,
  ADD COLUMN IF NOT EXISTS snapshot_cargo text,
  ADD COLUMN IF NOT EXISTS snapshot_cbo text,
  ADD COLUMN IF NOT EXISTS escalation_sent_at timestamptz;

-- 4. Contatos de emergência da empresa (para 4D)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS emergency_contacts jsonb DEFAULT '[]'::jsonb;

-- 5. soc_employees
CREATE TABLE IF NOT EXISTS public.soc_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cpf_hash text NOT NULL,
  cpf_last4 text,
  matricula text,
  unidade text,
  setor text,
  ghe text,
  cargo text,
  cbo text,
  situacao text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, cpf_hash)
);

GRANT SELECT ON public.soc_employees TO authenticated;
GRANT ALL ON public.soc_employees TO service_role;

ALTER TABLE public.soc_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all soc_employees"
  ON public.soc_employees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST managers can view their companies' soc_employees"
  ON public.soc_employees FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'sst') AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments a
      WHERE a.company_id = soc_employees.company_id
        AND a.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  );

CREATE TRIGGER trg_soc_employees_updated_at
  BEFORE UPDATE ON public.soc_employees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_soc_employees_company ON public.soc_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_soc_employees_lookup ON public.soc_employees(company_id, cpf_hash);

-- 6. soc_sync_logs
CREATE TABLE IF NOT EXISTS public.soc_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  total_employees integer DEFAULT 0,
  status text NOT NULL DEFAULT 'running',
  error_message text,
  triggered_by uuid
);

GRANT SELECT ON public.soc_sync_logs TO authenticated;
GRANT ALL ON public.soc_sync_logs TO service_role;

ALTER TABLE public.soc_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all soc_sync_logs"
  ON public.soc_sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST managers can view their sync logs"
  ON public.soc_sync_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'sst') AND EXISTS (
      SELECT 1 FROM public.company_sst_assignments a
      WHERE a.company_id = soc_sync_logs.company_id
        AND a.sst_manager_id = public.get_user_sst_manager_id(auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_soc_sync_logs_company ON public.soc_sync_logs(company_id, started_at DESC);

-- 7. report_access_audit
CREATE TABLE IF NOT EXISTS public.report_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_role text,
  justification text,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.report_access_audit TO authenticated;
GRANT ALL ON public.report_access_audit TO service_role;

ALTER TABLE public.report_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own audit entries"
  ON public.report_access_audit FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit entries"
  ON public.report_access_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own audit entries"
  ON public.report_access_audit FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_report_access_audit_report ON public.report_access_audit(report_id, accessed_at DESC);
