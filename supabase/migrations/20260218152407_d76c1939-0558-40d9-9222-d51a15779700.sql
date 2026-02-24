
-- Create access_logs table for tracking user activity and errors
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NULL,
  user_email TEXT NULL,
  user_role TEXT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT NULL,
  error_message TEXT NULL,
  error_stack TEXT NULL,
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries by time
CREATE INDEX idx_access_logs_created_at ON public.access_logs (created_at DESC);
CREATE INDEX idx_access_logs_event_type ON public.access_logs (event_type);
CREATE INDEX idx_access_logs_user_email ON public.access_logs (user_email);

-- Enable Row Level Security
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "Admins can view all access logs"
ON public.access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert logs (used by edge function)
-- No INSERT policy for regular users — all writes go through edge function with service role
