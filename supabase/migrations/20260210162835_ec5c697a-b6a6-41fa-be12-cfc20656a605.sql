-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Allow anonymous insert hseit_responses" ON public.hseit_responses;
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.hseit_responses;
DROP POLICY IF EXISTS "Allow anonymous insert hseit_answers" ON public.hseit_answers;

-- Create PERMISSIVE insert policies
CREATE POLICY "Allow public insert hseit_responses"
ON public.hseit_responses
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow public insert hseit_answers"
ON public.hseit_answers
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
