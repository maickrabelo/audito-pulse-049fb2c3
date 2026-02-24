-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can insert reports" ON public.reports;

-- Create new policy that allows anonymous (unauthenticated) and authenticated users to insert reports
CREATE POLICY "Allow anonymous and authenticated users to insert reports"
ON public.reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);