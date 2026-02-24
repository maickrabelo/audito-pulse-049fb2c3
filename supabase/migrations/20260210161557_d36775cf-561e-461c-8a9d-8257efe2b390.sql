-- Allow anonymous inserts for HSE-IT form responses
CREATE POLICY "Allow anonymous insert hseit_responses"
ON public.hseit_responses
FOR INSERT
WITH CHECK (true);

-- Allow anonymous inserts for HSE-IT form answers
CREATE POLICY "Allow anonymous insert hseit_answers"
ON public.hseit_answers
FOR INSERT
WITH CHECK (true);
