-- ===== ENUMS =====
CREATE TYPE public.competencia_denuncia AS ENUM ('SST_NR1','EMPRESA_CLIENTE','DENUNCIA_MISTA','INFORMACOES_INSUFICIENTES');
CREATE TYPE public.risco_imediato AS ENUM ('SIM','NAO','INDETERMINADO');
CREATE TYPE public.prioridade_denuncia AS ENUM ('CRITICA','ALTA','MODERADA','BAIXA');
CREATE TYPE public.pilar_psicossocial AS ENUM ('PT-00','PT-01','PT-02','PT-03','PT-04','PT-05','PT-06');
CREATE TYPE public.estado_denuncia AS ENUM (
  'RECEBIDA','VALIDACAO_DE_VINCULO','AGUARDANDO_TRIAGEM','EM_TRIAGEM','AGUARDANDO_COMPLEMENTACAO',
  'AGUARDANDO_VALIDACAO_HUMANA','CLASSIFICADA','ALERTA_CRITICO_ATIVO','ENCAMINHADA_AMO','ENCAMINHADA_EMPRESA',
  'EM_TRATATIVA_MISTA','AGUARDANDO_EVIDENCIAS','EM_ANALISE_TECNICA_AMO','EM_APURACAO_EMPRESA','MEDIDAS_DEFINIDAS',
  'PLANO_DE_ACAO_ABERTO','EM_ACOMPANHAMENTO','AGUARDANDO_VALIDACAO_DE_ENCERRAMENTO','ENCERRADA','ARQUIVADA');
CREATE TYPE public.escopo_subtratativa AS ENUM ('AMO','EMPRESA');

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'triador_sst';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'medico_trabalho';

-- ===== COLUNAS EM REPORTS =====
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS estado public.estado_denuncia NOT NULL DEFAULT 'RECEBIDA',
  ADD COLUMN IF NOT EXISTS competencia public.competencia_denuncia,
  ADD COLUMN IF NOT EXISTS risco_grave_imediato public.risco_imediato,
  ADD COLUMN IF NOT EXISTS prioridade public.prioridade_denuncia,
  ADD COLUMN IF NOT EXISTS pilares public.pilar_psicossocial[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parte_amo text,
  ADD COLUMN IF NOT EXISTS parte_empresa text,
  ADD COLUMN IF NOT EXISTS confianca_ia integer,
  ADD COLUMN IF NOT EXISTS ia_schema_valido boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dados_faltantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS documentos_sugeridos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trechos_relevantes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS acao_recomendada jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS versao_classificacao integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS classificado_por uuid,
  ADD COLUMN IF NOT EXISTS classificado_em timestamptz,
  ADD COLUMN IF NOT EXISTS justificativa_humana text,
  ADD COLUMN IF NOT EXISTS triador_id uuid,
  ADD COLUMN IF NOT EXISTS data_inicio_ocorrencia date,
  ADD COLUMN IF NOT EXISTS data_fim_ocorrencia date,
  ADD COLUMN IF NOT EXISTS periodo_descritivo text,
  ADD COLUMN IF NOT EXISTS local_ocorrencia text,
  ADD COLUMN IF NOT EXISTS pessoas_envolvidas text,
  ADD COLUMN IF NOT EXISTS testemunhas text,
  ADD COLUMN IF NOT EXISTS evidencias_disponiveis text,
  ADD COLUMN IF NOT EXISTS ha_risco_imediato_informado boolean,
  ADD COLUMN IF NOT EXISTS autorizacao_para_contato boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS canal_de_contato text,
  ADD COLUMN IF NOT EXISTS aceite_politica_privacidade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declaracao_de_boa_fe boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS empresa_confirmou_recebimento_em timestamptz;

-- ===== MIGRAÇÃO DOS DADOS EXISTENTES =====
UPDATE public.reports SET
  competencia = CASE ai_classification
    WHEN '4A_sst' THEN 'SST_NR1'::public.competencia_denuncia
    WHEN '4B_out_of_scope' THEN 'EMPRESA_CLIENTE'::public.competencia_denuncia
    WHEN '4C_mixed' THEN 'DENUNCIA_MISTA'::public.competencia_denuncia
    WHEN '4D_grave_immediate' THEN 'SST_NR1'::public.competencia_denuncia
    ELSE NULL END,
  risco_grave_imediato = CASE WHEN ai_classification = '4D_grave_immediate' THEN 'SIM'::public.risco_imediato
    WHEN ai_classification = 'pending_ai' OR ai_classification IS NULL THEN NULL
    ELSE 'NAO'::public.risco_imediato END,
  prioridade = CASE WHEN ai_classification = '4D_grave_immediate' THEN 'CRITICA'::public.prioridade_denuncia
    WHEN ai_classification = 'pending_ai' OR ai_classification IS NULL THEN NULL
    ELSE 'MODERADA'::public.prioridade_denuncia END,
  pilares = CASE
    WHEN ai_classification IN ('4A_sst','4C_mixed','4D_grave_immediate') THEN ARRAY['PT-02']::public.pilar_psicossocial[]
    WHEN ai_classification = '4B_out_of_scope' THEN ARRAY['PT-00']::public.pilar_psicossocial[]
    ELSE '{}'::public.pilar_psicossocial[] END,
  estado = CASE
    WHEN status IN ('resolvido','resolved','closed','encerrado') THEN 'ENCERRADA'::public.estado_denuncia
    WHEN status IN ('in_progress','em_andamento') THEN 'EM_ANALISE_TECNICA_AMO'::public.estado_denuncia
    ELSE 'AGUARDANDO_TRIAGEM'::public.estado_denuncia END;

-- ===== PARAMETROS DO CANAL (PD-001..PD-015) =====
CREATE TABLE public.parametros_canal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  confianca_minima integer NOT NULL DEFAULT 70,
  prioridade_risco_indeterminado public.prioridade_denuncia NOT NULL DEFAULT 'ALTA',
  prioridade_risco_nao public.prioridade_denuncia NOT NULL DEFAULT 'MODERADA',
  prazo_complementacao_dias integer NOT NULL DEFAULT 7,
  lembretes_complementacao integer NOT NULL DEFAULT 2,
  politica_cpf text NOT NULL DEFAULT 'opcional',
  anexo_max_mb integer NOT NULL DEFAULT 20,
  anexo_max_qtd integer NOT NULL DEFAULT 10,
  anexo_tipos_permitidos text[] NOT NULL DEFAULT ARRAY['pdf','png','jpg','jpeg','webp','mp3','m4a','docx','xlsx'],
  aprovadores_encerramento integer NOT NULL DEFAULT 1,
  min_grupo_indicadores integer NOT NULL DEFAULT 5,
  retencao_denuncia_meses integer NOT NULL DEFAULT 60,
  retencao_cpf_hash_meses integer NOT NULL DEFAULT 6,
  canais_notificacao text[] NOT NULL DEFAULT ARRAY['email','interno'],
  uf_calendario text NOT NULL DEFAULT 'BR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id)
);
CREATE UNIQUE INDEX parametros_canal_global_idx ON public.parametros_canal ((company_id IS NULL)) WHERE company_id IS NULL;
GRANT SELECT ON public.parametros_canal TO authenticated;
GRANT ALL ON public.parametros_canal TO service_role;
ALTER TABLE public.parametros_canal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "params_read" ON public.parametros_canal FOR SELECT TO authenticated USING (true);
CREATE POLICY "params_admin" ON public.parametros_canal FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.parametros_canal (company_id) VALUES (NULL);

-- ===== FERIADOS =====
CREATE TABLE public.feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  descricao text NOT NULL,
  abrangencia text NOT NULL DEFAULT 'BR',
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feriados_read" ON public.feriados FOR SELECT TO authenticated USING (true);
CREATE POLICY "feriados_admin" ON public.feriados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== FUNÇÃO AUXILIAR: EQUIPE AMO =====
CREATE OR REPLACE FUNCTION public.is_amo_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text IN ('admin','triador_sst','apurador','comite','dpo','medico_trabalho'))
$$;

-- ===== SUBTRATATIVAS =====
CREATE TABLE public.subtratativas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  escopo public.escopo_subtratativa NOT NULL,
  resumo text NOT NULL,
  responsavel_id uuid,
  estado public.estado_denuncia NOT NULL DEFAULT 'CLASSIFICADA',
  prazo_limite timestamptz,
  concluida_em timestamptz,
  conclusao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, escopo)
);
GRANT SELECT, INSERT, UPDATE ON public.subtratativas TO authenticated;
GRANT ALL ON public.subtratativas TO service_role;
ALTER TABLE public.subtratativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subtrat_amo" ON public.subtratativas FOR ALL TO authenticated
  USING (public.is_amo_team(auth.uid())) WITH CHECK (public.is_amo_team(auth.uid()));
CREATE POLICY "subtrat_empresa_read" ON public.subtratativas FOR SELECT TO authenticated
  USING (escopo = 'EMPRESA' AND EXISTS (
    SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));
CREATE POLICY "subtrat_empresa_update" ON public.subtratativas FOR UPDATE TO authenticated
  USING (escopo = 'EMPRESA' AND EXISTS (
    SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id))
  WITH CHECK (escopo = 'EMPRESA');

-- ===== VERSÕES DE CLASSIFICAÇÃO =====
CREATE TABLE public.classificacao_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  versao integer NOT NULL,
  origem text NOT NULL,
  competencia public.competencia_denuncia,
  risco_grave_imediato public.risco_imediato,
  prioridade public.prioridade_denuncia,
  pilares public.pilar_psicossocial[] NOT NULL DEFAULT '{}',
  parte_amo text,
  parte_empresa text,
  justificativa text,
  confianca integer,
  payload jsonb,
  autor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, versao)
);
GRANT SELECT, INSERT ON public.classificacao_versoes TO authenticated;
GRANT ALL ON public.classificacao_versoes TO service_role;
ALTER TABLE public.classificacao_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clv_amo_read" ON public.classificacao_versoes FOR SELECT TO authenticated USING (public.is_amo_team(auth.uid()));
CREATE POLICY "clv_amo_insert" ON public.classificacao_versoes FOR INSERT TO authenticated WITH CHECK (public.is_amo_team(auth.uid()));

-- ===== SOLICITAÇÕES DE EVIDÊNCIA =====
CREATE TABLE public.solicitacoes_evidencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  subtratativa_id uuid REFERENCES public.subtratativas(id) ON DELETE SET NULL,
  documento text NOT NULL,
  descricao text,
  destinatario text NOT NULL DEFAULT 'EMPRESA',
  solicitado_por uuid,
  prazo_limite timestamptz,
  status text NOT NULL DEFAULT 'pendente',
  atendida_em timestamptz,
  attachment_id uuid REFERENCES public.report_attachments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.solicitacoes_evidencia TO authenticated;
GRANT ALL ON public.solicitacoes_evidencia TO service_role;
ALTER TABLE public.solicitacoes_evidencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evid_amo" ON public.solicitacoes_evidencia FOR ALL TO authenticated
  USING (public.is_amo_team(auth.uid())) WITH CHECK (public.is_amo_team(auth.uid()));
CREATE POLICY "evid_empresa_read" ON public.solicitacoes_evidencia FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));
CREATE POLICY "evid_empresa_update" ON public.solicitacoes_evidencia FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id)) WITH CHECK (true);

-- ===== ANÁLISES TÉCNICAS =====
CREATE TABLE public.analises_tecnicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  pilares_confirmados public.pilar_psicossocial[] NOT NULL DEFAULT '{}',
  evidencias_avaliadas text,
  fatores_identificados text,
  conclusao_tecnica text NOT NULL,
  recomendacoes text,
  necessita_pgr boolean NOT NULL DEFAULT false,
  necessita_treinamento boolean NOT NULL DEFAULT false,
  necessita_monitoramento boolean NOT NULL DEFAULT false,
  responsavel_id uuid,
  emitido_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.analises_tecnicas TO authenticated;
GRANT ALL ON public.analises_tecnicas TO service_role;
ALTER TABLE public.analises_tecnicas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analise_amo" ON public.analises_tecnicas FOR ALL TO authenticated
  USING (public.is_amo_team(auth.uid())) WITH CHECK (public.is_amo_team(auth.uid()));
CREATE POLICY "analise_empresa_read" ON public.analises_tecnicas FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));

-- ===== PLANOS DE AÇÃO =====
CREATE TABLE public.planos_acao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  subtratativa_id uuid REFERENCES public.subtratativas(id) ON DELETE SET NULL,
  acao text NOT NULL,
  tipo text NOT NULL DEFAULT 'corretiva',
  responsavel_nome text NOT NULL,
  responsavel_id uuid,
  prazo date NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  evidencia_conclusao text,
  concluido_em timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.planos_acao TO authenticated;
GRANT ALL ON public.planos_acao TO service_role;
ALTER TABLE public.planos_acao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plano_amo" ON public.planos_acao FOR ALL TO authenticated
  USING (public.is_amo_team(auth.uid())) WITH CHECK (public.is_amo_team(auth.uid()));
CREATE POLICY "plano_empresa_read" ON public.planos_acao FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));
CREATE POLICY "plano_empresa_update" ON public.planos_acao FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id)) WITH CHECK (true);

-- ===== SLA =====
CREATE TABLE public.sla_prazos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  evento text NOT NULL,
  iniciado_em timestamptz NOT NULL DEFAULT now(),
  limite_em timestamptz,
  pausado_em timestamptz,
  motivo_pausa text,
  total_pausa_segundos integer NOT NULL DEFAULT 0,
  concluido_em timestamptz,
  em_atraso boolean NOT NULL DEFAULT false,
  alerta_enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sla_prazos TO authenticated;
GRANT ALL ON public.sla_prazos TO service_role;
ALTER TABLE public.sla_prazos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sla_amo_read" ON public.sla_prazos FOR SELECT TO authenticated USING (public.is_amo_team(auth.uid()));
CREATE POLICY "sla_empresa_read" ON public.sla_prazos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));

-- ===== COMUNICAÇÕES =====
CREATE TABLE public.comunicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  evento text NOT NULL,
  canal text NOT NULL DEFAULT 'email',
  destinatario text NOT NULL,
  assunto text,
  template text,
  status_entrega text NOT NULL DEFAULT 'enviado',
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.comunicacoes TO authenticated;
GRANT ALL ON public.comunicacoes TO service_role;
ALTER TABLE public.comunicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "com_amo_read" ON public.comunicacoes FOR SELECT TO authenticated USING (public.is_amo_team(auth.uid()));

-- ===== EVENTOS DE AUDITORIA (insert-only) =====
CREATE TABLE public.eventos_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  ator_id uuid,
  ator_papel text,
  antes jsonb,
  depois jsonb,
  justificativa text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.eventos_auditoria TO authenticated;
GRANT ALL ON public.eventos_auditoria TO service_role;
ALTER TABLE public.eventos_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aud_read" ON public.eventos_auditoria FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'dpo'));
CREATE POLICY "aud_insert" ON public.eventos_auditoria FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ===== TRIGGERS updated_at =====
CREATE TRIGGER t_subtrat_upd BEFORE UPDATE ON public.subtratativas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_evid_upd BEFORE UPDATE ON public.solicitacoes_evidencia FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_analise_upd BEFORE UPDATE ON public.analises_tecnicas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_plano_upd BEFORE UPDATE ON public.planos_acao FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_sla_upd BEFORE UPDATE ON public.sla_prazos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER t_param_upd BEFORE UPDATE ON public.parametros_canal FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===== ÍNDICES =====
CREATE INDEX idx_reports_estado ON public.reports(estado);
CREATE INDEX idx_reports_prioridade ON public.reports(prioridade);
CREATE INDEX idx_subtrat_report ON public.subtratativas(report_id);
CREATE INDEX idx_sla_report ON public.sla_prazos(report_id);
CREATE INDEX idx_aud_report ON public.eventos_auditoria(report_id);
CREATE INDEX idx_planos_report ON public.planos_acao(report_id);