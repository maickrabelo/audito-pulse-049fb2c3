-- Add public SELECT policy to companies table so anonymous users can view company details for report submission
-- This is required for the whistleblower/ouvidoria system where anonymous users need to access company-specific report pages

CREATE POLICY "Public can view company basics for reports"
ON public.companies 
FOR SELECT
TO anon, authenticated
USING (true);