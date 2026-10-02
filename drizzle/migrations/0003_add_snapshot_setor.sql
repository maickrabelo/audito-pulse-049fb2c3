ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS snapshot_setor text;
NOTIFY pgrst, 'reload schema';