
-- Add slug column to sst_managers for white-label URLs
ALTER TABLE public.sst_managers ADD COLUMN slug text UNIQUE;

-- Generate slugs for existing managers based on their name
-- Converts to lowercase, replaces spaces/special chars with hyphens, removes accents
UPDATE public.sst_managers 
SET slug = lower(
  regexp_replace(
    regexp_replace(
      translate(
        name,
        'áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ',
        'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'
      ),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Create index for faster slug lookups
CREATE INDEX idx_sst_managers_slug ON public.sst_managers(slug);
