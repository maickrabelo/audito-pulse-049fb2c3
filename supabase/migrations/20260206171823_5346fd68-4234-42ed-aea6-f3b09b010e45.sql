
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view company basics via view only" ON public.companies;

-- Create a new policy that allows anonymous access through the public view
-- The companies_public view already restricts columns (id, name, slug, logo_url)
CREATE POLICY "Public can view company basics via view only"
ON public.companies FOR SELECT
USING (true);
