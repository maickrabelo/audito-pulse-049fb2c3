
CREATE POLICY "SST can update assigned company reports"
ON public.reports
FOR UPDATE
USING (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = reports.company_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = reports.company_id
  )
);

CREATE POLICY "SST can insert updates for assigned company reports"
ON public.report_updates
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE r.id = report_updates.report_id AND csa.company_id = r.company_id
  )
);

CREATE POLICY "SST can view updates for assigned company reports"
ON public.report_updates
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
    SELECT 1 FROM public.reports r
    JOIN public.profiles p ON p.id = auth.uid()
    JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE r.id = report_updates.report_id AND csa.company_id = r.company_id
  )
);
