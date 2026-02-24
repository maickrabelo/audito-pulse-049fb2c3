-- Allow companies to insert their own surveys
CREATE POLICY "Companies can insert their surveys"
ON public.climate_surveys
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = climate_surveys.company_id
  )
);

-- Allow companies to update their own surveys
CREATE POLICY "Companies can update their surveys"
ON public.climate_surveys
FOR UPDATE
USING (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = climate_surveys.company_id
  )
);

-- Allow companies to delete their own surveys
CREATE POLICY "Companies can delete their surveys"
ON public.climate_surveys
FOR DELETE
USING (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = climate_surveys.company_id
  )
);

-- Allow companies to manage questions for their surveys
CREATE POLICY "Companies can view their survey questions"
ON public.survey_questions
FOR SELECT
USING (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_questions.survey_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Companies can insert their survey questions"
ON public.survey_questions
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_questions.survey_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Companies can update their survey questions"
ON public.survey_questions
FOR UPDATE
USING (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_questions.survey_id
    AND p.id = auth.uid()
  )
);

CREATE POLICY "Companies can delete their survey questions"
ON public.survey_questions
FOR DELETE
USING (
  has_role(auth.uid(), 'company'::app_role) AND
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_questions.survey_id
    AND p.id = auth.uid()
  )
);