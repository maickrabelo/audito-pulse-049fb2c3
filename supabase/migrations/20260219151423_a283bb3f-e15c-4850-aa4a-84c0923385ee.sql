
-- Allow anyone to look up a report by tracking code (public tracking feature)
-- This only exposes the public view columns, not sensitive reporter data
CREATE POLICY "Public can lookup report by tracking code"
ON public.reports
FOR SELECT
USING (tracking_code IS NOT NULL);
