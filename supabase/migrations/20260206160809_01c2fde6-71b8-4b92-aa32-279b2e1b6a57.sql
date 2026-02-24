
-- 1. Adicionar coluna max_companies à tabela sst_managers
ALTER TABLE public.sst_managers ADD COLUMN max_companies integer NOT NULL DEFAULT 50;

-- 2. Função auxiliar para obter sst_manager_id do usuário atual (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_user_sst_manager_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sst_manager_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- 3. Função auxiliar para contar empresas de um SST manager (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.count_sst_companies(_sst_manager_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.company_sst_assignments
  WHERE sst_manager_id = _sst_manager_id
$$;

-- 4. Função auxiliar para obter max_companies de um SST manager (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_sst_max_companies(_sst_manager_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(max_companies, 50)
  FROM public.sst_managers
  WHERE id = _sst_manager_id
$$;

-- 5. Políticas RLS na tabela companies para SST

-- SST pode visualizar empresas atribuídas
CREATE POLICY "SST can view assigned companies"
ON public.companies
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = companies.id
    AND p.id = auth.uid()
  )
);

-- SST pode inserir empresas (validação do limite é feita pelo trigger)
CREATE POLICY "SST can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role)
);

-- SST pode atualizar empresas atribuídas
CREATE POLICY "SST can update assigned companies"
ON public.companies
FOR UPDATE
USING (
  has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.company_sst_assignments csa
    JOIN public.profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE csa.company_id = companies.id
    AND p.id = auth.uid()
  )
);

-- 6. Política RLS na tabela company_sst_assignments para SST inserir
CREATE POLICY "SST can insert own assignments"
ON public.company_sst_assignments
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'sst'::app_role)
  AND sst_manager_id = public.get_user_sst_manager_id(auth.uid())
);

-- 7. Trigger de validação para impedir ultrapassar o limite de empresas
CREATE OR REPLACE FUNCTION public.validate_sst_company_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
BEGIN
  -- Contar empresas atuais do SST manager
  SELECT COUNT(*)::integer INTO current_count
  FROM public.company_sst_assignments
  WHERE sst_manager_id = NEW.sst_manager_id;

  -- Obter limite máximo
  SELECT COALESCE(max_companies, 50) INTO max_allowed
  FROM public.sst_managers
  WHERE id = NEW.sst_manager_id;

  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de % empresas atingido para este gestor SST', max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_sst_company_limit
BEFORE INSERT ON public.company_sst_assignments
FOR EACH ROW
EXECUTE FUNCTION public.validate_sst_company_limit();
