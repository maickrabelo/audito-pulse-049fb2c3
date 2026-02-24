-- Allow SST users to upload logos to company-logos bucket
CREATE POLICY "SST can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'sst'::app_role)
);

-- Allow SST users to update their uploaded logos
CREATE POLICY "SST can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'sst'::app_role)
);
