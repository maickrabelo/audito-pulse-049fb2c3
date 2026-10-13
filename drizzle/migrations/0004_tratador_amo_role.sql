ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tratador_amo';

CREATE OR REPLACE FUNCTION public.is_tratador_amo(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'tratador_amo')
$$;

CREATE OR REPLACE FUNCTION public.is_report_amo_scope(_report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.reports WHERE id = _report_id
    AND competencia IN ('SST_NR1','DENUNCIA_MISTA'))
$$;

CREATE POLICY "Tratador AMO views AMO reports" ON public.reports FOR SELECT TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND competencia IN ('SST_NR1','DENUNCIA_MISTA'));
CREATE POLICY "Tratador AMO views companies" ON public.companies FOR SELECT TO authenticated
  USING (public.is_tratador_amo(auth.uid()));
CREATE POLICY "Tratador AMO analises" ON public.analises_tecnicas FOR ALL TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id))
  WITH CHECK (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id));
CREATE POLICY "Tratador AMO planos" ON public.planos_acao FOR ALL TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id))
  WITH CHECK (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id));
CREATE POLICY "Tratador AMO evidencias" ON public.solicitacoes_evidencia FOR ALL TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id))
  WITH CHECK (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id));
CREATE POLICY "Tratador AMO subtratativas" ON public.subtratativas FOR ALL TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND escopo = 'AMO')
  WITH CHECK (public.is_tratador_amo(auth.uid()) AND escopo = 'AMO');
CREATE POLICY "Tratador AMO sla" ON public.sla_prazos FOR SELECT TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id));
CREATE POLICY "Tratador AMO attachments" ON public.report_attachments FOR SELECT TO authenticated
  USING (public.is_tratador_amo(auth.uid()) AND public.is_report_amo_scope(report_id));