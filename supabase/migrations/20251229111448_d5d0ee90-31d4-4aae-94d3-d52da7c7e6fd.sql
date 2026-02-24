-- Drop and recreate the policy for admins to view all partners
DROP POLICY IF EXISTS "Partners can view own data" ON licensed_partners;
DROP POLICY IF EXISTS "Admins can view all partners" ON licensed_partners;

-- Create a permissive policy for admins to view all partners
CREATE POLICY "Admins can view all partners"
ON licensed_partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a permissive policy for partners to view their own data
CREATE POLICY "Partners can view own data"
ON licensed_partners
FOR SELECT
USING (user_id = auth.uid());