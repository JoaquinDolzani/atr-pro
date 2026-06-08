
-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('coach','athlete');
CREATE TYPE public.macro_phase AS ENUM ('General','Pre-competitivo','Competitivo','Transición');
CREATE TYPE public.zone_key AS ENUM ('R0','R1','R2','R3','R4','R5','R6');
CREATE TYPE public.session_type AS ENUM ('Pasadas','Fondo','Tempo','Fuerza','Cuestas');
CREATE TYPE public.microcycle AS ENUM ('Bajo','Medio','Alto');

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  dni TEXT,
  birth_date DATE,
  certificate_path TEXT,
  certificate_date DATE,
  objectives TEXT,
  phone TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  is_coach_self BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== ROLES ==========
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ========== POLICIES profiles ==========
CREATE POLICY "profile self select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "coach select all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'coach'));
CREATE POLICY "profile self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "coach update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));
CREATE POLICY "coach insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'coach') OR auth.uid() = id);

-- ========== POLICIES user_roles ==========
CREATE POLICY "self read roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "coach read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'coach'));

-- ========== COACH SETTINGS ==========
CREATE TABLE public.coach_settings (
  coach_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  whatsapp TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_settings TO authenticated;
GRANT ALL ON public.coach_settings TO service_role;
ALTER TABLE public.coach_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach manage own settings" ON public.coach_settings FOR ALL TO authenticated
  USING (coach_id = auth.uid() AND public.has_role(auth.uid(),'coach'))
  WITH CHECK (coach_id = auth.uid() AND public.has_role(auth.uid(),'coach'));
CREATE POLICY "athletes read coach settings" ON public.coach_settings FOR SELECT TO authenticated USING (true);

-- ========== MONTHLY LOADS ==========
CREATE TABLE public.monthly_loads (
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,  -- YYYY-MM
  km NUMERIC NOT NULL DEFAULT 0,
  macro public.macro_phase,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (athlete_id, month_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_loads TO authenticated;
GRANT ALL ON public.monthly_loads TO service_role;
ALTER TABLE public.monthly_loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athlete rw own loads" ON public.monthly_loads FOR ALL TO authenticated
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "coach rw all loads" ON public.monthly_loads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));

-- ========== TRAININGS ==========
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_type public.session_type,
  microcycle public.microcycle,
  zone public.zone_key NOT NULL DEFAULT 'R2',
  ec TEXT NOT NULL DEFAULT '',
  main TEXT NOT NULL DEFAULT '',
  vc TEXT NOT NULL DEFAULT '',
  planned_km NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(athlete_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athlete read own trainings" ON public.trainings FOR SELECT TO authenticated USING (athlete_id = auth.uid());
CREATE POLICY "coach rw all trainings" ON public.trainings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));

-- ========== REPORTS ==========
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  km NUMERIC NOT NULL DEFAULT 0,
  time_min NUMERIC NOT NULL DEFAULT 0,
  rpe INT NOT NULL DEFAULT 5,
  notes TEXT,
  links TEXT[] NOT NULL DEFAULT '{}',
  photos TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athlete rw own reports" ON public.reports FOR ALL TO authenticated
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "coach rw all reports" ON public.reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));

-- ========== RACES ==========
CREATE TABLE public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  distance_km NUMERIC NOT NULL,
  time_sec INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.races TO authenticated;
GRANT ALL ON public.races TO service_role;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athlete rw own races" ON public.races FOR ALL TO authenticated
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());
CREATE POLICY "coach rw all races" ON public.races FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'coach')) WITH CHECK (public.has_role(auth.uid(),'coach'));

-- Ensure only one active race per athlete
CREATE OR REPLACE FUNCTION public.enforce_single_active_race()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.active THEN
    UPDATE public.races SET active = false
    WHERE athlete_id = NEW.athlete_id AND id <> NEW.id AND active = true;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_single_active_race
AFTER INSERT OR UPDATE OF active ON public.races
FOR EACH ROW WHEN (NEW.active)
EXECUTE FUNCTION public.enforce_single_active_race();

-- ========== TIMESTAMPS ==========
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_coach_settings_updated BEFORE UPDATE ON public.coach_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_trainings_updated BEFORE UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER t_monthly_loads_updated BEFORE UPDATE ON public.monthly_loads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== NEW USER HANDLER ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_coach BOOLEAN := lower(NEW.email) = 'joa.dolzani42@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_coach_self)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), is_coach)
  ON CONFLICT (id) DO NOTHING;

  IF is_coach THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'coach') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'athlete') ON CONFLICT DO NOTHING;
    INSERT INTO public.coach_settings (coach_id, display_name) VALUES (NEW.id, 'Coach') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'athlete') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
