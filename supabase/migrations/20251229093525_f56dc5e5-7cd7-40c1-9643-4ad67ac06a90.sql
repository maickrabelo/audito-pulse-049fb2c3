-- Fix RLS policies for licensed_partners table
DROP POLICY IF EXISTS "Anyone can register as partner" ON public.licensed_partners;

CREATE POLICY "Anyone can register as partner" 
ON public.licensed_partners 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Fix RLS policies for affiliates table
DROP POLICY IF EXISTS "Anyone can register as affiliate" ON public.affiliates;

CREATE POLICY "Anyone can register as affiliate" 
ON public.affiliates 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Fix RLS policies for partner_representatives table
DROP POLICY IF EXISTS "Anyone can add representatives during registration" ON public.partner_representatives;

CREATE POLICY "Anyone can add representatives during registration" 
ON public.partner_representatives 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);