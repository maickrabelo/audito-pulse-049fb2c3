-- Add notification email fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS notification_email_1 TEXT,
ADD COLUMN IF NOT EXISTS notification_email_2 TEXT,
ADD COLUMN IF NOT EXISTS notification_email_3 TEXT;