-- Ensure proper grants for partner/affiliate registration and self-service access
-- Schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Partner registration (public insert)
GRANT INSERT ON TABLE public.licensed_partners TO anon;
GRANT INSERT ON TABLE public.partner_representatives TO anon;

-- Affiliate registration (public insert)
GRANT INSERT ON TABLE public.affiliates TO anon;

-- Logged-in access (self-service + admin via RLS)
GRANT SELECT, INSERT, UPDATE ON TABLE public.licensed_partners TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.partner_representatives TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.affiliates TO authenticated;