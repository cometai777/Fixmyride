-- Allow admins to update admin_users, but only super admins can change roles.

-- Helper: allow update if (super admin) OR (admin & role unchanged)
CREATE OR REPLACE FUNCTION public.can_update_admin_user_role(target_id bigint, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  existing_role text;
BEGIN
  -- super admin can do anything
  IF public.is_super_admin_user() THEN
    RETURN true;
  END IF;

  -- admins can update but must not change role
  IF NOT public.is_admin_user() THEN
    RETURN false;
  END IF;

  SELECT au.role
    INTO existing_role
  FROM public.admin_users au
  WHERE au.id = target_id;

  RETURN existing_role IS NOT NULL AND existing_role = new_role;
END;
$$;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Keep existing select policies; replace update policies
DROP POLICY IF EXISTS admin_users_update_super_admin ON public.admin_users;
DROP POLICY IF EXISTS admin_users_update_admin ON public.admin_users;

-- Super admin: full update
CREATE POLICY admin_users_update_super_admin
ON public.admin_users
FOR UPDATE
TO authenticated
USING (public.is_super_admin_user())
WITH CHECK (public.is_super_admin_user());

-- Admin: can update rows but cannot change role
CREATE POLICY admin_users_update_admin
ON public.admin_users
FOR UPDATE
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.can_update_admin_user_role(id, role));

