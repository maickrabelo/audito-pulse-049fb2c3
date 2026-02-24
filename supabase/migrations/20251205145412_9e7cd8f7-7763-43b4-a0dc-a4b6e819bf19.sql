-- Create enum for question types
CREATE TYPE public.survey_question_type AS ENUM ('likert', 'single_choice', 'multiple_choice', 'scale_0_10', 'open_text');

-- Create climate_surveys table
CREATE TABLE public.climate_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_questions table
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type survey_question_type NOT NULL DEFAULT 'likert',
  category TEXT,
  options JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.climate_surveys(id) ON DELETE CASCADE,
  respondent_token TEXT NOT NULL UNIQUE,
  department TEXT,
  demographics JSONB,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create survey_answers table
CREATE TABLE public.survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_value TEXT,
  answer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_climate_surveys_company_id ON public.climate_surveys(company_id);
CREATE INDEX idx_climate_surveys_is_active ON public.climate_surveys(is_active);
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_answers_response_id ON public.survey_answers(response_id);
CREATE INDEX idx_survey_answers_question_id ON public.survey_answers(question_id);

-- Enable RLS
ALTER TABLE public.climate_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for climate_surveys
CREATE POLICY "Public can view active surveys" ON public.climate_surveys
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all surveys" ON public.climate_surveys
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their surveys" ON public.climate_surveys
  FOR SELECT USING (
    has_role(auth.uid(), 'company') AND 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.company_id = climate_surveys.company_id)
  );

CREATE POLICY "SST can view assigned company surveys" ON public.climate_surveys
  FOR SELECT USING (
    has_role(auth.uid(), 'sst') AND 
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = climate_surveys.company_id
    )
  );

-- RLS Policies for survey_questions
CREATE POLICY "Public can view questions of active surveys" ON public.survey_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM climate_surveys WHERE climate_surveys.id = survey_questions.survey_id AND climate_surveys.is_active = true)
  );

CREATE POLICY "Admins can manage all questions" ON public.survey_questions
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for survey_responses
CREATE POLICY "Anyone can insert responses" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all responses" ON public.survey_responses
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their survey responses" ON public.survey_responses
  FOR SELECT USING (
    has_role(auth.uid(), 'company') AND 
    EXISTS (
      SELECT 1 FROM climate_surveys cs
      JOIN profiles p ON p.company_id = cs.company_id
      WHERE cs.id = survey_responses.survey_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "SST can view assigned company responses" ON public.survey_responses
  FOR SELECT USING (
    has_role(auth.uid(), 'sst') AND 
    EXISTS (
      SELECT 1 FROM climate_surveys cs
      JOIN company_sst_assignments csa ON csa.company_id = cs.company_id
      JOIN profiles p ON p.sst_manager_id = csa.sst_manager_id
      WHERE cs.id = survey_responses.survey_id AND p.id = auth.uid()
    )
  );

-- RLS Policies for survey_answers
CREATE POLICY "Anyone can insert answers" ON public.survey_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all answers" ON public.survey_answers
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their survey answers" ON public.survey_answers
  FOR SELECT USING (
    has_role(auth.uid(), 'company') AND 
    EXISTS (
      SELECT 1 FROM survey_responses sr
      JOIN climate_surveys cs ON cs.id = sr.survey_id
      JOIN profiles p ON p.company_id = cs.company_id
      WHERE sr.id = survey_answers.response_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "SST can view assigned company answers" ON public.survey_answers
  FOR SELECT USING (
    has_role(auth.uid(), 'sst') AND 
    EXISTS (
      SELECT 1 FROM survey_responses sr
      JOIN climate_surveys cs ON cs.id = sr.survey_id
      JOIN company_sst_assignments csa ON csa.company_id = cs.company_id
      JOIN profiles p ON p.sst_manager_id = csa.sst_manager_id
      WHERE sr.id = survey_answers.response_id AND p.id = auth.uid()
    )
  );

-- Trigger for updated_at on climate_surveys
CREATE TRIGGER update_climate_surveys_updated_at
  BEFORE UPDATE ON public.climate_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();