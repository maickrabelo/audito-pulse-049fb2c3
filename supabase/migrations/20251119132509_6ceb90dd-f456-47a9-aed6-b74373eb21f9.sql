-- Allow public to view SST assignments for companies
CREATE POLICY "Public can view company SST assignments"
ON public.company_sst_assignments
FOR SELECT
USING (true);

-- Allow public to view SST manager basic info (name and logo)
CREATE POLICY "Public can view SST managers basic info"
ON public.sst_managers
FOR SELECT
USING (true);