
-- Insert missing profile for grupoamo user
INSERT INTO public.profiles (id, full_name, sst_manager_id, must_change_password)
VALUES ('9cf65be2-c565-4d2a-9770-98b867e87b27', 'Grupo AMO', 'a0a70e8c-26cc-4aaf-8587-22b39ef6cabd', false);

-- Insert missing role for grupoamo user
INSERT INTO public.user_roles (user_id, role)
VALUES ('9cf65be2-c565-4d2a-9770-98b867e87b27', 'sst');

-- Re-create the trigger that was missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
