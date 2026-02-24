
-- Add target_sst_manager_ids column to the 3 portal tables
ALTER TABLE public.sst_portal_messages ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;
ALTER TABLE public.sst_portal_documents ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;
ALTER TABLE public.sst_portal_trainings ADD COLUMN target_sst_manager_ids uuid[] DEFAULT NULL;

-- Drop existing SST SELECT policies and recreate with targeting filter
DROP POLICY IF EXISTS "SST can view portal messages" ON public.sst_portal_messages;
CREATE POLICY "SST can view targeted portal messages"
ON public.sst_portal_messages
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role) AND (
    target_sst_manager_ids IS NULL
    OR get_user_sst_manager_id(auth.uid()) = ANY(target_sst_manager_ids)
  )
);

DROP POLICY IF EXISTS "SST can view portal documents" ON public.sst_portal_documents;
CREATE POLICY "SST can view targeted portal documents"
ON public.sst_portal_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role) AND (
    target_sst_manager_ids IS NULL
    OR get_user_sst_manager_id(auth.uid()) = ANY(target_sst_manager_ids)
  )
);

DROP POLICY IF EXISTS "SST can view portal trainings" ON public.sst_portal_trainings;
CREATE POLICY "SST can view targeted portal trainings"
ON public.sst_portal_trainings
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role) AND (
    target_sst_manager_ids IS NULL
    OR get_user_sst_manager_id(auth.uid()) = ANY(target_sst_manager_ids)
  )
);
