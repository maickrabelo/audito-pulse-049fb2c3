-- Novo valor de taxonomia: possível âmbito criminal (aditivo, não quebra nada)
ALTER TYPE public.report_classification ADD VALUE IF NOT EXISTS '4B_cr';

-- Auditoria técnica das interações da assistente do Canal de Escuta
CREATE TABLE IF NOT EXISTS public.chat_ai_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  case_id text NOT NULL,
  mode text NOT NULL DEFAULT 'chat',
  model text NOT NULL,
  injection_detected boolean NOT NULL DEFAULT false,
  injection_patterns jsonb NOT NULL DEFAULT '[]'::jsonb,
  guardrail_violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  schema_valid boolean NOT NULL DEFAULT true,
  schema_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  analysis_result jsonb,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_ai_audit_company ON public.chat_ai_audit (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_ai_audit_case ON public.chat_ai_audit (case_id);

GRANT ALL ON public.chat_ai_audit TO service_role;
GRANT SELECT ON public.chat_ai_audit TO authenticated;

ALTER TABLE public.chat_ai_audit ENABLE ROW LEVEL SECURITY;

-- Somente equipe AMO/master enxerga a auditoria técnica (isolamento estrito)
CREATE POLICY "AMO team reads chat ai audit"
ON public.chat_ai_audit FOR SELECT TO authenticated
USING (public.is_amo_team(auth.uid()));
