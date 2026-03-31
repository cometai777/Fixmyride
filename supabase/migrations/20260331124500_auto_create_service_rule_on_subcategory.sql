-- Auto-create a default service_rules row whenever a service_subcategories row is inserted.
-- This makes subcategory creation “complete” without frontend doing extra inserts.
--
-- Assumptions based on schema:
-- - public.service_categories has columns: id, code, ...
-- - public.service_subcategories has: id, category_id, code, name, ...
-- - public.service_rules has: category_code, subcategory_code, title, priority, is_active, allowed_city, allowed, ...
--
-- Apply in Supabase SQL Editor.

-- Ensure there's only one rule per subcategory code (recommended).
CREATE UNIQUE INDEX IF NOT EXISTS service_rules_subcategory_code_key
  ON public.service_rules (subcategory_code);

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
    priority,
    is_active,
    allowed_city,
    allowed,
    service_area_required,
    ask_followup_question,
    require_vehicle_make,
    require_vehicle_model,
    require_vehicle_year,
    require_part_check,
    require_pricing_check
  )
  VALUES (
    v_category_code,
    NEW.code,
    CONCAT('Default Rule for ', COALESCE(NEW.name, NEW.code)),
    NULL,
    1,
    true,
    'Dubai',
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  )
  ON CONFLICT (subcategory_code) DO NOTHING;

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

