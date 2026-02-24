-- SST can INSERT climate surveys for assigned companies
CREATE POLICY "SST can insert surveys for assigned companies"
ON climate_surveys FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = climate_surveys.company_id
  )
);

-- SST can UPDATE climate surveys for assigned companies
CREATE POLICY "SST can update surveys for assigned companies"
ON climate_surveys FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = climate_surveys.company_id
  )
);

-- SST can DELETE climate surveys for assigned companies
CREATE POLICY "SST can delete surveys for assigned companies"
ON climate_surveys FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE p.id = auth.uid() AND csa.company_id = climate_surveys.company_id
  )
);

-- SST can INSERT survey questions for assigned companies
CREATE POLICY "SST can insert questions for assigned companies"
ON survey_questions FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_questions.survey_id AND csa.company_id = cs.company_id
  )
);

-- SST can UPDATE survey questions for assigned companies
CREATE POLICY "SST can update questions for assigned companies"
ON survey_questions FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_questions.survey_id AND csa.company_id = cs.company_id
  )
);

-- SST can DELETE survey questions for assigned companies
CREATE POLICY "SST can delete questions for assigned companies"
ON survey_questions FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_questions.survey_id AND csa.company_id = cs.company_id
  )
);

-- SST can view survey questions for assigned companies
CREATE POLICY "SST can view questions for assigned companies"
ON survey_questions FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_questions.survey_id AND csa.company_id = cs.company_id
  )
);

-- SST can manage survey departments for assigned companies
CREATE POLICY "SST can manage departments for assigned companies"
ON survey_departments FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_departments.survey_id AND csa.company_id = cs.company_id
  )
)
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.id = auth.uid()
    JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
    WHERE cs.id = survey_departments.survey_id AND csa.company_id = cs.company_id
  )
);