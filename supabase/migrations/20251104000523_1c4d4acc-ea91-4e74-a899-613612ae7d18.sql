-- Create table for rate limiting chat requests
CREATE TABLE IF NOT EXISTS public.chat_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  company_id UUID,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_chat_rate_limits_session ON public.chat_rate_limits(session_id, created_at DESC);
CREATE INDEX idx_chat_rate_limits_company ON public.chat_rate_limits(company_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow the service role to manage rate limits (edge functions use service role)
CREATE POLICY "Service role can manage rate limits"
ON public.chat_rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to clean up old rate limit records (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.chat_rate_limits
  WHERE created_at < now() - interval '1 hour';
END;
$$;