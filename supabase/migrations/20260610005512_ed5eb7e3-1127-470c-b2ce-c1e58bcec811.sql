
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS completed_at timestamptz;

DROP POLICY IF EXISTS "athlete mark own training completed" ON public.trainings;
CREATE POLICY "athlete mark own training completed"
ON public.trainings
FOR UPDATE
TO authenticated
USING (athlete_id = auth.uid())
WITH CHECK (athlete_id = auth.uid());
