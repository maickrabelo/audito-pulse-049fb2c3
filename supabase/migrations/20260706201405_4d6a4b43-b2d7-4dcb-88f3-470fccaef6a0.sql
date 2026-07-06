DROP TRIGGER IF EXISTS validate_sst_company_limit_trigger ON public.company_sst_assignments;
DROP TRIGGER IF EXISTS trg_validate_sst_company_limit ON public.company_sst_assignments;
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.company_sst_assignments'::regclass AND NOT tgisinternal LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.company_sst_assignments', t.tgname);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_sst_max_companies(_sst_manager_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT 2147483647 $$;