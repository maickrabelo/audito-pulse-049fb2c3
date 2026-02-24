-- Create table for survey departments/sectors
CREATE TABLE public.survey_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_count INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.survey_departments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all departments
CREATE POLICY "Admins can manage all departments" 
ON public.survey_departments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for companies to manage their survey departments
CREATE POLICY "Companies can manage their survey departments" 
ON public.survey_departments 
FOR ALL 
USING (
  has_role(auth.uid(), 'company'::app_role) AND 
  EXISTS (
    SELECT 1 FROM climate_surveys cs
    JOIN profiles p ON p.company_id = cs.company_id
    WHERE cs.id = survey_departments.survey_id AND p.id = auth.uid()
  )
);

-- Policy for public to view departments of active surveys (for the survey form)
CREATE POLICY "Public can view departments of active surveys" 
ON public.survey_departments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM climate_surveys
    WHERE climate_surveys.id = survey_departments.survey_id 
    AND climate_surveys.is_active = true
  )
);

-- Create index for faster lookups
CREATE INDEX idx_survey_departments_survey_id ON public.survey_departments(survey_id);