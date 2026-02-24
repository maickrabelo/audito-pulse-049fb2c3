-- Tabela de Avaliações de Burnout
CREATE TABLE public.burnout_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Departamentos/Setores para Burnout
CREATE TABLE public.burnout_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.burnout_assessments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  employee_count INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Respostas (anônimas)
CREATE TABLE public.burnout_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.burnout_assessments(id) ON DELETE CASCADE,
  department TEXT,
  respondent_token TEXT NOT NULL UNIQUE,
  demographics JSONB DEFAULT '{}',
  total_score INTEGER,
  risk_level TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Respostas Individuais
CREATE TABLE public.burnout_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.burnout_responses(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  answer_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.burnout_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for burnout_assessments
CREATE POLICY "Admins can manage all burnout assessments"
ON public.burnout_assessments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "SST managers can manage assigned company burnout assessments"
ON public.burnout_assessments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'sst') AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = burnout_assessments.company_id AND p.id = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'sst') AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = burnout_assessments.company_id AND p.id = auth.uid()
  )
);

CREATE POLICY "Public can view active burnout assessments"
ON public.burnout_assessments FOR SELECT TO anon, authenticated
USING (is_active = true);

-- RLS Policies for burnout_departments
CREATE POLICY "Anyone can read burnout departments"
ON public.burnout_departments FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage burnout departments"
ON public.burnout_departments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- RLS Policies for burnout_responses
CREATE POLICY "Anyone can insert burnout responses"
ON public.burnout_responses FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read burnout responses"
ON public.burnout_responses FOR SELECT TO anon, authenticated
USING (true);

-- RLS Policies for burnout_answers
CREATE POLICY "Anyone can insert burnout answers"
ON public.burnout_answers FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read burnout answers"
ON public.burnout_answers FOR SELECT TO anon, authenticated
USING (true);

-- Trigger for updated_at using existing function
CREATE TRIGGER update_burnout_assessments_updated_at
BEFORE UPDATE ON public.burnout_assessments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();