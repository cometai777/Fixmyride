-- Add timestamp columns expected by common Supabase triggers (e.g. updated_at).
-- Fixes: record "new" has no field "updated_at" on UPDATE to public.service_rules

ALTER TABLE public.service_rules
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- If you don't already have an updated_at trigger, create a simple one.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_rules_set_updated_at ON public.service_rules;
CREATE TRIGGER service_rules_set_updated_at
BEFORE UPDATE ON public.service_rules
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

