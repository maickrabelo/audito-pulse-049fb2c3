-- Fix RLS policies for survey_responses - change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.survey_responses;

CREATE POLICY "Anyone can insert responses"
ON public.survey_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Fix RLS policies for survey_answers - change from RESTRICTIVE to PERMISSIVE  
DROP POLICY IF EXISTS "Anyone can insert answers" ON public.survey_answers;

CREATE POLICY "Anyone can insert answers"
ON public.survey_answers
FOR INSERT
TO public
WITH CHECK (true);