ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS period text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS weekly_target integer NOT NULL DEFAULT 7;

CREATE OR REPLACE FUNCTION public.habits_validate_period()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.period NOT IN ('daily', 'weekly') THEN
    RAISE EXCEPTION 'period must be daily or weekly';
  END IF;
  IF NEW.weekly_target < 1 OR NEW.weekly_target > 7 THEN
    RAISE EXCEPTION 'weekly_target must be between 1 and 7';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS habits_validate_period_trg ON public.habits;
CREATE TRIGGER habits_validate_period_trg
  BEFORE INSERT OR UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.habits_validate_period();