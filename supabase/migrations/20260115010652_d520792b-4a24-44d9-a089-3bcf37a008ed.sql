
-- Create HSE-IT assessments table
CREATE TABLE public.hseit_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HSE-IT departments table
CREATE TABLE public.hseit_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.hseit_assessments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_count INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HSE-IT responses table
CREATE TABLE public.hseit_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.hseit_assessments(id) ON DELETE CASCADE,
  department TEXT,
  respondent_token TEXT NOT NULL,
  demographics JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HSE-IT answers table
CREATE TABLE public.hseit_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL REFERENCES public.hseit_responses(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  answer_value INTEGER NOT NULL CHECK (answer_value >= 1 AND answer_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_hseit_assessments_company ON public.hseit_assessments(company_id);
CREATE INDEX idx_hseit_assessments_active ON public.hseit_assessments(is_active);
CREATE INDEX idx_hseit_departments_assessment ON public.hseit_departments(assessment_id);
CREATE INDEX idx_hseit_responses_assessment ON public.hseit_responses(assessment_id);
CREATE INDEX idx_hseit_answers_response ON public.hseit_answers(response_id);

-- Enable RLS
ALTER TABLE public.hseit_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hseit_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hseit_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hseit_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hseit_assessments
CREATE POLICY "Admins can manage all HSE-IT assessments"
  ON public.hseit_assessments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can view assigned company assessments"
  ON public.hseit_assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = hseit_assessments.company_id
    )
  );

CREATE POLICY "SST can insert assessments for assigned companies"
  ON public.hseit_assessments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = hseit_assessments.company_id
    )
  );

CREATE POLICY "SST can update assessments for assigned companies"
  ON public.hseit_assessments FOR UPDATE
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = hseit_assessments.company_id
    )
  );

CREATE POLICY "SST can delete assessments for assigned companies"
  ON public.hseit_assessments FOR DELETE
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = hseit_assessments.company_id
    )
  );

CREATE POLICY "Companies can view their assessments"
  ON public.hseit_assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'company'::app_role) AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = hseit_assessments.company_id
    )
  );

CREATE POLICY "Public can view active assessments"
  ON public.hseit_assessments FOR SELECT
  USING (is_active = true);

-- RLS Policies for hseit_departments
CREATE POLICY "Admins can manage all HSE-IT departments"
  ON public.hseit_departments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can manage departments for assigned companies"
  ON public.hseit_departments FOR ALL
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_assessments ha
      JOIN profiles p ON p.id = auth.uid()
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE ha.id = hseit_departments.assessment_id AND csa.company_id = ha.company_id
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_assessments ha
      JOIN profiles p ON p.id = auth.uid()
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE ha.id = hseit_departments.assessment_id AND csa.company_id = ha.company_id
    )
  );

CREATE POLICY "Companies can manage their assessment departments"
  ON public.hseit_departments FOR ALL
  USING (
    has_role(auth.uid(), 'company'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_assessments ha
      JOIN profiles p ON p.company_id = ha.company_id
      WHERE ha.id = hseit_departments.assessment_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Public can view departments of active assessments"
  ON public.hseit_departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hseit_assessments
      WHERE id = hseit_departments.assessment_id AND is_active = true
    )
  );

-- RLS Policies for hseit_responses
CREATE POLICY "Admins can view all HSE-IT responses"
  ON public.hseit_responses FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert responses"
  ON public.hseit_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "SST can view assigned company responses"
  ON public.hseit_responses FOR SELECT
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_assessments ha
      JOIN profiles p ON p.id = auth.uid()
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE ha.id = hseit_responses.assessment_id AND csa.company_id = ha.company_id
    )
  );

CREATE POLICY "Companies can view their assessment responses"
  ON public.hseit_responses FOR SELECT
  USING (
    has_role(auth.uid(), 'company'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_assessments ha
      JOIN profiles p ON p.company_id = ha.company_id
      WHERE ha.id = hseit_responses.assessment_id AND p.id = auth.uid()
    )
  );

-- RLS Policies for hseit_answers
CREATE POLICY "Admins can view all HSE-IT answers"
  ON public.hseit_answers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert answers"
  ON public.hseit_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "SST can view assigned company answers"
  ON public.hseit_answers FOR SELECT
  USING (
    has_role(auth.uid(), 'sst'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_responses hr
      JOIN hseit_assessments ha ON ha.id = hr.assessment_id
      JOIN profiles p ON p.id = auth.uid()
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE hr.id = hseit_answers.response_id AND csa.company_id = ha.company_id
    )
  );

CREATE POLICY "Companies can view their assessment answers"
  ON public.hseit_answers FOR SELECT
  USING (
    has_role(auth.uid(), 'company'::app_role) AND
    EXISTS (
      SELECT 1 FROM hseit_responses hr
      JOIN hseit_assessments ha ON ha.id = hr.assessment_id
      JOIN profiles p ON p.company_id = ha.company_id
      WHERE hr.id = hseit_answers.response_id AND p.id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_hseit_assessments_updated_at
  BEFORE UPDATE ON public.hseit_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
