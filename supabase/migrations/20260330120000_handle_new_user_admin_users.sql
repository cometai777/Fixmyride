-- When a new Supabase Auth user is created, mirror them into public.admin_users.
-- Runs with SECURITY DEFINER so it succeeds even when RLS blocks client INSERTs.
-- Note: your admin_users table uses id int8 and also has a password column.
-- This trigger intentionally does NOT write admin_users.id or password; it relies on DB defaults.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a matching admin_users row for every signup.
  -- Important: your admin_users table (per your screenshot) requires: id, created_at, role (NOT NULL).
  -- We rely on DB defaults for id; we set created_at explicitly to avoid missing-default issues.
  INSERT INTO public.admin_users (created_at, auth_user_id, email, full_name, role, is_active, password)
  VALUES (
    now(),
    NEW.id,
    lower(trim(NEW.email)),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    'user',
    true,
    COALESCE(NEW.encrypted_password, '')
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
