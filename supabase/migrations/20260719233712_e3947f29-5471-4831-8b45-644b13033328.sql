
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  hashed_pw text := crypt('zPH3FaG8TZtwb0GcJah$', gen_salt('bf'));
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    'master@ouvidoria.amo', hashed_pw, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Master Admin"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id, 'master@ouvidoria.amo')::jsonb,
    'email', new_user_id::text, now(), now(), now());

  -- Ensure role is admin (trigger sets 'pending')
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = new_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin');
  END IF;
END $$;
