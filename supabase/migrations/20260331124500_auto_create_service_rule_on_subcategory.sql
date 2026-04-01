-- Auto-create a default service_rules row whenever a service_subcategories row is inserted.
-- This makes subcategory creation “complete” without frontend doing extra inserts.
--
-- Assumptions based on schema:
-- - public.service_categories has columns: id, code, ...
-- - public.service_subcategories has: id, category_id, code, name, ...
-- - public.service_rules has at least: category_code, subcategory_code, title, description, is_active, actions
--
-- Apply in Supabase SQL Editor.

-- Ensure there's only one rule per (category_code, subcategory_code).
-- service_subcategories is unique on (category_id, code), so subcategory codes may repeat across categories.
DROP INDEX IF EXISTS public.service_rules_subcategory_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS service_rules_category_subcategory_key
  ON public.service_rules (category_code, subcategory_code);

-- Force-replace any older versions of the trigger/function.
-- (CASCADE will drop triggers that reference the function.)
DROP FUNCTION IF EXISTS public.handle_new_service_subcategory() CASCADE;
DROP FUNCTION IF EXISTS public.handle_delete_service_subcategory() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_service_subcategory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category_code text;
BEGIN
  SELECT c.code
    INTO v_category_code
  FROM public.service_categories c
  WHERE c.id = NEW.category_id;

  INSERT INTO public.service_rules (
    category_code,
    subcategory_code,
    title,
    description,
    is_active,
    actions
  )
  VALUES (
    v_category_code,
    NEW.code,
    CONCAT('Default Rule for ', COALESCE(NEW.name, NEW.code)),
    NULL,
    true,
    jsonb_build_array(
      'Require vehicle make, model, and year',
      'Check the parts',
      'Explain the price to customers',
      'Offer booking link'
    )
  )
  ON CONFLICT (category_code, subcategory_code)
  DO UPDATE SET
    category_code = EXCLUDED.category_code,
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    -- Keep existing description/actions if already customized
    description = COALESCE(public.service_rules.description, EXCLUDED.description),
    actions = COALESCE(public.service_rules.actions, EXCLUDED.actions);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_service_subcategory_created ON public.service_subcategories;
CREATE TRIGGER on_service_subcategory_created
  AFTER INSERT ON public.service_subcategories
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_service_subcategory();

-- Optional: cleanup rule when a subcategory is deleted
CREATE OR REPLACE FUNCTION public.handle_delete_service_subcategory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.service_rules WHERE subcategory_code = OLD.code;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_service_subcategory_deleted ON public.service_subcategories;
CREATE TRIGGER on_service_subcategory_deleted
  AFTER DELETE ON public.service_subcategories
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_delete_service_subcategory();

