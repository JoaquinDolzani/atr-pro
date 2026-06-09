
-- 1) profiles: is_active + avatar_path
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS avatar_path text;

-- 2) payments
CREATE TABLE IF NOT EXISTS public.payments (
  athlete_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key text NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, month_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athlete reads own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (athlete_id = auth.uid() OR public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coach manages payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'coach'))
  WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE TRIGGER payments_touch BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3) recalc monthly km from trainings + reports
CREATE OR REPLACE FUNCTION public.recalc_monthly_km(_athlete uuid, _month text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  total numeric := 0;
BEGIN
  -- Sumar reports.km del mes (real). Si no hay report ese día, usar planned_km del training.
  SELECT COALESCE(SUM(
    CASE WHEN r.km IS NOT NULL AND r.km > 0 THEN r.km
         ELSE COALESCE(t.planned_km, 0) END
  ), 0) INTO total
  FROM (
    SELECT date FROM public.trainings WHERE athlete_id = _athlete AND to_char(date, 'YYYY-MM') = _month
    UNION
    SELECT date FROM public.reports   WHERE athlete_id = _athlete AND to_char(date, 'YYYY-MM') = _month
  ) d
  LEFT JOIN public.trainings t ON t.athlete_id = _athlete AND t.date = d.date
  LEFT JOIN public.reports   r ON r.athlete_id = _athlete AND r.date = d.date;

  INSERT INTO public.monthly_loads (athlete_id, month_key, km)
  VALUES (_athlete, _month, total)
  ON CONFLICT (athlete_id, month_key) DO UPDATE SET km = EXCLUDED.km;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_km()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recalc_monthly_km(OLD.athlete_id, to_char(OLD.date,'YYYY-MM'));
    RETURN OLD;
  ELSE
    PERFORM public.recalc_monthly_km(NEW.athlete_id, to_char(NEW.date,'YYYY-MM'));
    IF (TG_OP = 'UPDATE' AND (OLD.athlete_id <> NEW.athlete_id OR OLD.date <> NEW.date)) THEN
      PERFORM public.recalc_monthly_km(OLD.athlete_id, to_char(OLD.date,'YYYY-MM'));
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trainings_recalc_km ON public.trainings;
CREATE TRIGGER trainings_recalc_km
  AFTER INSERT OR UPDATE OR DELETE ON public.trainings
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_km();

DROP TRIGGER IF EXISTS reports_recalc_km ON public.reports;
CREATE TRIGGER reports_recalc_km
  AFTER INSERT OR UPDATE OR DELETE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_km();

-- Recalcular todo el histórico una vez
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT DISTINCT athlete_id, to_char(date,'YYYY-MM') AS mk FROM public.trainings
    UNION
    SELECT DISTINCT athlete_id, to_char(date,'YYYY-MM') AS mk FROM public.reports
  LOOP
    PERFORM public.recalc_monthly_km(r.athlete_id, r.mk);
  END LOOP;
END $$;
