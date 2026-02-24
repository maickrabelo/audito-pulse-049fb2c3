-- Allow public to insert comments on reports
CREATE POLICY "Public can insert comments on reports"
ON public.report_updates
FOR INSERT
TO public
WITH CHECK (user_id IS NULL);