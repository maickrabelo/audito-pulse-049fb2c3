-- Add 'pending' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pending';

-- Create profiles table for user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  sst_manager_id uuid REFERENCES public.sst_managers(id) ON DELETE SET NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  department text,
  status text NOT NULL DEFAULT 'pending',
  urgency text NOT NULL DEFAULT 'medium',
  is_anonymous boolean NOT NULL DEFAULT false,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  tracking_code text UNIQUE
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view their own reports"
  ON public.reports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'company') AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.company_id = reports.company_id
    )
  );

CREATE POLICY "SST can view assigned company reports"
  ON public.reports FOR SELECT
  USING (
    public.has_role(auth.uid(), 'sst') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.company_sst_assignments csa ON csa.sst_manager_id = p.sst_manager_id
      WHERE p.id = auth.uid() AND csa.company_id = reports.company_id
    )
  );

CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update all reports"
  ON public.reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can update their own reports"
  ON public.reports FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'company') AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.company_id = reports.company_id
    )
  );

CREATE POLICY "Admins can delete all reports"
  ON public.reports FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create report_updates table
CREATE TABLE IF NOT EXISTS public.report_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  old_status text,
  new_status text NOT NULL,
  notes text
);

-- Enable RLS on report_updates
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;

-- Report updates policies
CREATE POLICY "Users can view updates for reports they can see"
  ON public.report_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reports
      WHERE reports.id = report_updates.report_id
    )
  );

CREATE POLICY "Authenticated users can insert updates"
  ON public.report_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for reports updated_at
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  -- Assign 'pending' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'pending');
  
  RETURN new;
END;
$$;

-- Trigger to auto-create profile and assign pending role
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique tracking code
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists_flag boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.reports WHERE tracking_code = code) INTO exists_flag;
    EXIT WHEN NOT exists_flag;
  END LOOP;
  RETURN code;
END;
$$;

-- Trigger to auto-generate tracking code
CREATE OR REPLACE FUNCTION public.set_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tracking_code IS NULL THEN
    NEW.tracking_code := public.generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_tracking_code
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tracking_code();