-- Ensure admin_users contains all auth.users and admins can list all rows.

-- 1) Backfill: insert missing admin_users rows for existing auth users
INSERT INTO public.admin_users (created_at, auth_user_id, email, full_name, role, is_active, password)
SELECT
  now(),
  u.id,
  lower(trim(u.email)),
  NULLIF(trim(COALESCE(u.raw_user_meta_data->>'full_name', '')), ''),
  'user',
  true,
  COALESCE(u.encrypted_password, '')
FROM auth.users u
WHERE u.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.admin_users au
    WHERE au.auth_user_id = u.id
       OR lower(trim(au.email)) = lower(trim(u.email))
  );

-- 2) RLS: allow admin users to SELECT all admin_users rows
-- Keep the "select own" policy for regular users; add an admin-wide read policy.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_select_admins ON public.admin_users;
CREATE POLICY admin_users_select_admins
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin_user());

