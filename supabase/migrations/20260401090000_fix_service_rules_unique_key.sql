-- Fix service_rules uniqueness so subcategory codes can repeat across categories.
-- service_subcategories has UNIQUE(category_id, code), so "code" is not globally unique.
-- Therefore service_rules should also be unique per category+subcategory.

-- 1) Replace the unique index
DROP INDEX IF EXISTS public.service_rules_subcategory_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS service_rules_category_subcategory_key
  ON public.service_rules (category_code, subcategory_code);

-- 2) Ensure the trigger function upserts using the same unique key
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
    title = EXCLUDED.title,
    is_active = EXCLUDED.is_active,
    -- Keep existing description/actions if already customized
    description = COALESCE(public.service_rules.description, EXCLUDED.description),
    actions = COALESCE(public.service_rules.actions, EXCLUDED.actions);

  RETURN NEW;
END;
$$;

