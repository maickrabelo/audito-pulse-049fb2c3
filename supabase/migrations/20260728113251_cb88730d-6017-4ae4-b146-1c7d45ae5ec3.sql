DROP POLICY IF EXISTS "subtrat_empresa_update" ON public.subtratativas;
CREATE POLICY "subtrat_empresa_update" ON public.subtratativas FOR UPDATE TO authenticated
  USING (escopo = 'EMPRESA' AND EXISTS (
    SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id))
  WITH CHECK (escopo = 'EMPRESA' AND EXISTS (
    SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));

DROP POLICY IF EXISTS "evid_empresa_update" ON public.solicitacoes_evidencia;
CREATE POLICY "evid_empresa_update" ON public.solicitacoes_evidencia FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));

DROP POLICY IF EXISTS "plano_empresa_update" ON public.planos_acao;
CREATE POLICY "plano_empresa_update" ON public.planos_acao FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.reports r JOIN public.profiles p ON p.id = auth.uid()
    WHERE r.id = report_id AND r.company_id = p.company_id));