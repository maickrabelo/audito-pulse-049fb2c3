-- Allow anon to SELECT their own just-inserted response (needed for .select() after .insert())
CREATE POLICY "Allow anon select own hseit_responses"
ON public.hseit_responses
AS PERMISSIVE
FOR SELECT
TO anon, authenticated
USING (true);
