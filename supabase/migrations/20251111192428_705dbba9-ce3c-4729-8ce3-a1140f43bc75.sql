-- Update all existing tracking codes to new AAAA000 format
UPDATE public.reports 
SET tracking_code = public.generate_tracking_code()
WHERE tracking_code IS NOT NULL;