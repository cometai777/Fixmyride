-- Best-practice auth linkage:
-- - Keep admin_users.id as your app PK (int8)
-- - Add admin_users.auth_user_id uuid referencing auth.users.id
-- - Use auth_user_id for secure ownership + RLS and for lookups in the app
--
-- Run this in Supabase SQL Editor.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Ensure 1:1 mapping between an auth user and an admin_users row.
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_auth_user_id_key
  ON public.admin_users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Backfill for existing users by matching on email (lowercased).
UPDATE public.admin_users au
SET auth_user_id = u.id
FROM auth.users u
WHERE au.auth_user_id IS NULL
  AND lower(trim(au.email)) = lower(trim(u.email));

-- Optional: enforce FK (won't block deletes unless you want it).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_users_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.admin_users
      ADD CONSTRAINT admin_users_auth_user_id_fkey
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- RLS (recommended). If you already have policies, review before enabling.
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Users can read only their own admin profile.
DROP POLICY IF EXISTS admin_users_select_own ON public.admin_users;
CREATE POLICY admin_users_select_own
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid());

-- Only super admin can update roles / activation.
-- This policy assumes role text values: 'user', 'admin', 'super admin'
DROP POLICY IF EXISTS admin_users_update_super_admin ON public.admin_users;
CREATE POLICY admin_users_update_super_admin
ON public.admin_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users me
    WHERE me.auth_user_id = auth.uid()
      AND me.role = 'super admin'
      AND me.is_active IS NOT FALSE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users me
    WHERE me.auth_user_id = auth.uid()
      AND me.role = 'super admin'
      AND me.is_active IS NOT FALSE
  )
);

