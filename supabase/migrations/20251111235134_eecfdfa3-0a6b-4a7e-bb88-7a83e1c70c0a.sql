-- Allow public access to view reports by tracking code
CREATE POLICY "Public can view reports by tracking code"
ON public.reports
FOR SELECT
TO public
USING (tracking_code IS NOT NULL);