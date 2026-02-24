-- Create storage bucket for report attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-attachments', 'report-attachments', false);

-- Create RLS policies for the bucket
CREATE POLICY "Anyone can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-attachments');

CREATE POLICY "Admins can view all attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-attachments' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their report attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'report-attachments' 
  AND public.has_role(auth.uid(), 'company'::app_role)
);

-- Create table to track report attachments
CREATE TABLE public.report_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments table
CREATE POLICY "Anyone can insert attachments"
ON public.report_attachments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all attachments"
ON public.report_attachments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can view their report attachments"
ON public.report_attachments FOR SELECT
USING (
  public.has_role(auth.uid(), 'company'::app_role) 
  AND EXISTS (
    SELECT 1 FROM reports r
    JOIN profiles p ON p.company_id = r.company_id
    WHERE r.id = report_attachments.report_id AND p.id = auth.uid()
  )
);

CREATE POLICY "SST can view assigned company attachments"
ON public.report_attachments FOR SELECT
USING (
  public.has_role(auth.uid(), 'sst'::app_role)
  AND EXISTS (
    SELECT 1 FROM reports r
    JOIN company_sst_assignments csa ON csa.company_id = r.company_id
    JOIN profiles p ON p.sst_manager_id = csa.sst_manager_id
    WHERE r.id = report_attachments.report_id AND p.id = auth.uid()
  )
);