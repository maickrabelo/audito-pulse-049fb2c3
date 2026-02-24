
-- Add must_change_password column to profiles table
ALTER TABLE public.profiles ADD COLUMN must_change_password boolean DEFAULT false;

-- Allow users to update their own must_change_password flag
CREATE POLICY "Users can update own must_change_password"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
