
-- Add contract date columns to sst_managers
ALTER TABLE public.sst_managers
ADD COLUMN contract_signed_at timestamp with time zone DEFAULT NULL,
ADD COLUMN contract_expires_at timestamp with time zone DEFAULT NULL;

-- Create portal documents table
CREATE TABLE public.sst_portal_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  category text DEFAULT 'general',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sst_portal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all portal documents"
ON public.sst_portal_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can view portal documents"
ON public.sst_portal_documents FOR SELECT
USING (has_role(auth.uid(), 'sst'::app_role));

-- Create portal trainings table
CREATE TABLE public.sst_portal_trainings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  content_url text,
  thumbnail_url text,
  duration_minutes integer,
  category text DEFAULT 'general',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sst_portal_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all portal trainings"
ON public.sst_portal_trainings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can view portal trainings"
ON public.sst_portal_trainings FOR SELECT
USING (has_role(auth.uid(), 'sst'::app_role));

-- Create portal message board table
CREATE TABLE public.sst_portal_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sst_portal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all portal messages"
ON public.sst_portal_messages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can view portal messages"
ON public.sst_portal_messages FOR SELECT
USING (has_role(auth.uid(), 'sst'::app_role));

-- Create storage bucket for portal documents
INSERT INTO storage.buckets (id, name, public) VALUES ('sst-portal-documents', 'sst-portal-documents', false);

CREATE POLICY "Admins can upload portal documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sst-portal-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update portal documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sst-portal-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete portal documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'sst-portal-documents' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SST can view portal documents files"
ON storage.objects FOR SELECT
USING (bucket_id = 'sst-portal-documents' AND has_role(auth.uid(), 'sst'::app_role));
