-- Drop the restrictive policy
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.survey_responses;

-- Create a PERMISSIVE policy to allow public inserts
CREATE POLICY "Anyone can insert responses" 
ON public.survey_responses 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also fix survey_answers insert policy
DROP POLICY IF EXISTS "Anyone can insert answers" ON public.survey_answers;

CREATE POLICY "Anyone can insert answers" 
ON public.survey_answers 
FOR INSERT 
TO public
WITH CHECK (true);