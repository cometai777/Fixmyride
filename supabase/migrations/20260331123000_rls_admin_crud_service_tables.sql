-- Allow admin/super admin users to manage service_* tables.
-- Requires: public.admin_users.auth_user_id is populated and admin_users RLS is enabled.
--
-- Apply in Supabase SQL Editor.

-- Helper function to check admin role in RLS policies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.is_active IS NOT FALSE
      AND au.role IN ('admin', 'super admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.auth_user_id = auth.uid()
      AND au.is_active IS NOT FALSE
      AND au.role = 'super admin'
  );
$$;

-- SERVICE CATEGORIES
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_categories_read ON public.service_categories;
CREATE POLICY service_categories_read
ON public.service_categories
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS service_categories_write ON public.service_categories;
CREATE POLICY service_categories_write
ON public.service_categories
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- SERVICE SUBCATEGORIES
ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_subcategories_read ON public.service_subcategories;
CREATE POLICY service_subcategories_read
ON public.service_subcategories
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS service_subcategories_write ON public.service_subcategories;
CREATE POLICY service_subcategories_write
ON public.service_subcategories
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- SERVICE RULES
ALTER TABLE public.service_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_rules_read ON public.service_rules;
CREATE POLICY service_rules_read
ON public.service_rules
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS service_rules_write ON public.service_rules;
CREATE POLICY service_rules_write
ON public.service_rules
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- RULE CONDITIONS
ALTER TABLE public.rule_conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rule_conditions_read ON public.rule_conditions;
CREATE POLICY rule_conditions_read
ON public.rule_conditions
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS rule_conditions_write ON public.rule_conditions;
CREATE POLICY rule_conditions_write
ON public.rule_conditions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

-- RULE ACTIONS
ALTER TABLE public.rule_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rule_actions_read ON public.rule_actions;
CREATE POLICY rule_actions_read
ON public.rule_actions
FOR SELECT
TO authenticated
USING (public.is_admin_user());

DROP POLICY IF EXISTS rule_actions_write ON public.rule_actions;
CREATE POLICY rule_actions_write
ON public.rule_actions
FOR ALL
TO authenticated
USING (public.is_admin_user())
WITH CHECK (public.is_admin_user());

