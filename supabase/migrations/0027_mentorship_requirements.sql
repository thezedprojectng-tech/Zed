BEGIN;

-- 1. interest_area: drop the old enum check (stored as ANY(ARRAY[...]))
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.mentorship_applications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%interest_area%'
      AND pg_get_constraintdef(oid) LIKE '%ARRAY%'
  LOOP
    EXECUTE format('ALTER TABLE public.mentorship_applications DROP CONSTRAINT %I', r.conname);
  END LOOP;
END
$$;

ALTER TABLE public.mentorship_applications
  ADD CONSTRAINT mentorship_applications_interest_area_length
    CHECK (char_length(interest_area) >= 2 AND char_length(interest_area) <= 100);

-- 2. current_status: drop the old enum check (server always writes 'student')
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.mentorship_applications'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%current_status%'
      AND pg_get_constraintdef(oid) LIKE '%ARRAY%'
  LOOP
    EXECUTE format('ALTER TABLE public.mentorship_applications DROP CONSTRAINT %I', r.conname);
  END LOOP;
END
$$;

ALTER TABLE public.mentorship_applications
  ADD CONSTRAINT mentorship_applications_current_status_length
    CHECK (char_length(current_status) >= 1 AND char_length(current_status) <= 40);

-- 3. age
ALTER TABLE public.mentorship_applications
  ADD COLUMN IF NOT EXISTS age smallint NULL
    CONSTRAINT mentorship_applications_age_range
      CHECK (age IS NULL OR (age >= 21 AND age <= 100));

-- 4. skills
ALTER TABLE public.mentorship_applications
  ADD COLUMN IF NOT EXISTS skills text NULL
    CONSTRAINT mentorship_applications_skills_length
      CHECK (skills IS NULL OR (char_length(skills) >= 2 AND char_length(skills) <= 300));

-- 5. institution required (old rows get a placeholder so the constraint is fully valid)
UPDATE public.mentorship_applications
   SET institution = 'Not provided'
 WHERE institution IS NULL;

ALTER TABLE public.mentorship_applications
  ADD CONSTRAINT mentorship_applications_institution_required
    CHECK (institution IS NOT NULL);

COMMIT;