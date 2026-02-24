ALTER TABLE public.sst_managers 
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;