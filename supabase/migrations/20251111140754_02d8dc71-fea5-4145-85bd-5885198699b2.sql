-- Allow SST users to view assignments for their own sst_manager
CREATE POLICY "SST users can view their own assignments"
ON public.company_sst_assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'sst'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.sst_manager_id = company_sst_assignments.sst_manager_id
  )
);