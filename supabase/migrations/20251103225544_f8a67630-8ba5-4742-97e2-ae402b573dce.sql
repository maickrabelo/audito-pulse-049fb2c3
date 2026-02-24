-- Add slug field to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add index for better performance on slug lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);

-- Add comment
COMMENT ON COLUMN public.companies.slug IS 'URL-friendly unique identifier for the company';

-- Update existing companies to have slugs based on their names (if any exist)
-- This is safe as it will be a no-op if the column already has values
UPDATE public.companies 
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;