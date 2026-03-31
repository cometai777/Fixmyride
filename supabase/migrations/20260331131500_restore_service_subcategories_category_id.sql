-- Restore service_subcategories.category_id (FK to service_categories.id)
-- so every subcategory is linked to a category.
--
-- Apply in Supabase SQL Editor.

ALTER TABLE public.service_subcategories
  ADD COLUMN IF NOT EXISTS category_id bigint;

-- Backfill existing rows to a default category if missing.
-- If you have multiple categories and need accurate mapping, adjust this before running.
UPDATE public.service_subcategories
SET category_id = (SELECT id FROM public.service_categories ORDER BY id ASC LIMIT 1)
WHERE category_id IS NULL;

-- Make it required (optional but recommended).
ALTER TABLE public.service_subcategories
  ALTER COLUMN category_id SET NOT NULL;

-- Add FK constraint if not present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_subcategories_category_id_fkey'
  ) THEN
    ALTER TABLE public.service_subcategories
      ADD CONSTRAINT service_subcategories_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS service_subcategories_category_id_idx
  ON public.service_subcategories(category_id);

-- Refresh PostgREST schema cache if needed:
-- notify pgrst, 'reload schema';

