// Capa de datos sobre Supabase. Client-side, RLS protege todo.
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Athlete, MacroPhase, Race, Report, TrainingBlock, ZoneKey, SessionType, Microcycle,
} from "./atrt-derive";

export type Role = "coach" | "athlete";

export interface SessionProfile {
  id: string;
  email: string;
  fullName: string;
  dni: string;
  birthDate: string;
  certificatePath?: string;
  certificateDate: string;
  objectives: string;
  onboardingComplete: boolean;
  isCoachSelf: boolean;
}

export interface AuthState {
  loading: boolean;
  userId: string | null;
  email: string | null;
  roles: Role[];
  isCoach: boolean;
  profile: SessionProfile | null;
  refresh: () => void;
}

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const rolesQ = useQuery({
    queryKey: ["roles", userId, tick],
    enabled: !!userId,
    queryFn: async (): Promise<Role[]> => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      return (data || []).map((r) => r.role as Role);
    },
  });

  const profileQ = useQuery({
    queryKey: ["profile", userId, tick],
    enabled: !!userId,
    queryFn: async (): Promise<SessionProfile | null> => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        email: data.email || "",
        fullName: data.full_name || "",
        dni: data.dni || "",
        birthDate: data.birth_date || "",
        certificatePath: data.certificate_path || undefined,
        certificateDate: data.certificate_date || "",
        objectives: data.objectives || "",
        onboardingComplete: !!data.onboarding_complete,
        isCoachSelf: !!data.is_coach_self,
      };
    },
  });

  const roles = rolesQ.data || [];
  return {
    loading: loading || rolesQ.isLoading || profileQ.isLoading,
    userId, email, roles,
    isCoach: roles.includes("coach"),
    profile: profileQ.data || null,
    refresh: () => setTick((t) => t + 1),
  };
}

// ============== ATHLETE LIST (coach) ==============
export function useAthleteList() {
  return useQuery({
    queryKey: ["athletes"],
    queryFn: async () => {
      // Atletas = todos los profiles con rol "athlete"
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "athlete");
      const ids = (roles || []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from("profiles").select("id, full_name, email, dni, birth_date, certificate_date, is_coach_self")
        .in("id", ids);
      return (profs || []).map((p) => ({
        id: p.id,
        name: p.is_coach_self ? `${p.full_name || "Coach"} (Coach)` : (p.full_name || p.email || "Atleta"),
        email: p.email || "",
        dni: p.dni || "",
        birthDate: p.birth_date || "",
        certificateDate: p.certificate_date || "",
      }));
    },
  });
}

// ============== FULL ATHLETE LOAD ==============
async function fetchAthlete(id: string): Promise<Athlete | null> {
  const [{ data: profile }, { data: loads }, { data: trainings }, { data: reports }, { data: races }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("monthly_loads").select("*").eq("athlete_id", id),
    supabase.from("trainings").select("*").eq("athlete_id", id),
    supabase.from("reports").select("*").eq("athlete_id", id),
    supabase.from("races").select("*").eq("athlete_id", id).order("date", { ascending: false }),
  ]);
  if (!profile) return null;

  const monthlyKm: Record<string, number> = {};
  const macroByMonth: Record<string, MacroPhase> = {};
  for (const l of loads || []) {
    monthlyKm[l.month_key] = Number(l.km) || 0;
    if (l.macro) macroByMonth[l.month_key] = l.macro as MacroPhase;
  }

  const trainingsMap: Record<string, TrainingBlock> = {};
  for (const t of trainings || []) {
    trainingsMap[t.date] = {
      ec: t.ec || "", main: t.main || "", vc: t.vc || "",
      zone: (t.zone as ZoneKey) || "R2",
      sessionType: (t.session_type as SessionType) || undefined,
      microcycle: (t.microcycle as Microcycle) || undefined,
      plannedKm: Number(t.planned_km) || 0,
    };
  }

  const reportsMap: Record<string, Report> = {};
  for (const r of reports || []) {
    // Convertir paths a URLs firmadas para mostrar
    const photos: string[] = [];
    for (const p of r.photos || []) {
      const { data: u } = await supabase.storage.from("report-photos").createSignedUrl(p, 3600);
      if (u?.signedUrl) photos.push(u.signedUrl);
    }
    reportsMap[r.date] = {
      date: r.date,
      links: r.links || [],
      photos,
      km: Number(r.km) || 0,
      timeMin: Number(r.time_min) || 0,
      rpe: r.rpe || 5,
      notes: r.notes || undefined,
    };
  }

  const racesArr: Race[] = (races || []).map((r) => ({
    id: r.id, date: r.date, name: r.name,
    distanceKm: Number(r.distance_km), timeSec: r.time_sec,
    active: !!r.active,
  }));

  return {
    id: profile.id,
    name: profile.is_coach_self ? `${profile.full_name || "Coach"} (Coach)` : (profile.full_name || profile.email || "Atleta"),
    email: profile.email || "",
    dni: profile.dni || "",
    birthDate: profile.birth_date || "",
    certificateDate: profile.certificate_date || "",
    certificatePath: profile.certificate_path || undefined,
    objectives: profile.objectives || "",
    monthsOwed: 0,
    macroByMonth, monthlyKm,
    races: racesArr,
    trainings: trainingsMap,
    reports: reportsMap,
  };
}

export function useAthlete(id: string | null) {
  return useQuery({
    queryKey: ["athlete", id],
    enabled: !!id,
    queryFn: () => fetchAthlete(id!),
  });
}

// ============== COACH SETTINGS ==============
export function useCoachSettings() {
  return useQuery({
    queryKey: ["coach-settings"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "coach").limit(1);
      if (!roles || roles.length === 0) return { coachId: null as string | null, whatsapp: "", displayName: "" };
      const coachId = roles[0].user_id;
      const { data } = await supabase.from("coach_settings").select("*").eq("coach_id", coachId).maybeSingle();
      return { coachId, whatsapp: data?.whatsapp || "", displayName: data?.display_name || "" };
    },
  });
}

// ============== MUTATIONS ==============
export function useMutations(athleteId?: string) {
  const qc = useQueryClient();
  const inv = () => { qc.invalidateQueries({ queryKey: ["athlete", athleteId] }); qc.invalidateQueries({ queryKey: ["athletes"] }); };

  const updateProfile = useMutation({
    mutationFn: async (patch: Partial<{ full_name: string; dni: string; birth_date: string; certificate_date: string; certificate_path: string; objectives: string; onboarding_complete: boolean }>) => {
      const id = athleteId!;
      const { error } = await supabase.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { inv(); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });

  const upsertTraining = useMutation({
    mutationFn: async ({ date, block }: { date: string; block: TrainingBlock }) => {
      const { error } = await supabase.from("trainings").upsert({
        athlete_id: athleteId!, date,
        ec: block.ec, main: block.main, vc: block.vc, zone: block.zone,
        session_type: block.sessionType, microcycle: block.microcycle,
        planned_km: block.plannedKm ?? 0,
      }, { onConflict: "athlete_id,date" });
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const deleteTraining = useMutation({
    mutationFn: async (date: string) => {
      const { error } = await supabase.from("trainings").delete().eq("athlete_id", athleteId!).eq("date", date);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const upsertReport = useMutation({
    mutationFn: async (r: { date: string; km: number; timeMin: number; rpe: number; notes?: string; links: string[]; photos: string[] }) => {
      // photos = paths storage
      const { error } = await supabase.from("reports").upsert({
        athlete_id: athleteId!, date: r.date, km: r.km, time_min: r.timeMin, rpe: r.rpe,
        notes: r.notes || null, links: r.links, photos: r.photos,
      }, { onConflict: "athlete_id,date" } as never);
      if (error) {
        // fallback insert (no unique constraint? actually have only PK id)
        await supabase.from("reports").delete().eq("athlete_id", athleteId!).eq("date", r.date);
        const { error: e2 } = await supabase.from("reports").insert({
          athlete_id: athleteId!, date: r.date, km: r.km, time_min: r.timeMin, rpe: r.rpe,
          notes: r.notes || null, links: r.links, photos: r.photos,
        });
        if (e2) throw e2;
      }
    },
    onSuccess: inv,
  });

  const setMonthlyMacro = useMutation({
    mutationFn: async ({ month, macro }: { month: string; macro: MacroPhase }) => {
      const { error } = await supabase.from("monthly_loads").upsert(
        { athlete_id: athleteId!, month_key: month, macro, km: 0 } as never,
        { onConflict: "athlete_id,month_key", ignoreDuplicates: false }
      );
      if (error) {
        // partial upsert (no km change). Try update first
        const { data } = await supabase.from("monthly_loads").select("km").eq("athlete_id", athleteId!).eq("month_key", month).maybeSingle();
        if (data) {
          await supabase.from("monthly_loads").update({ macro }).eq("athlete_id", athleteId!).eq("month_key", month);
        } else {
          await supabase.from("monthly_loads").insert({ athlete_id: athleteId!, month_key: month, macro, km: 0 });
        }
      }
    },
    onSuccess: inv,
  });

  const setMonthlyKm = useMutation({
    mutationFn: async ({ month, km }: { month: string; km: number }) => {
      const { data } = await supabase.from("monthly_loads").select("macro").eq("athlete_id", athleteId!).eq("month_key", month).maybeSingle();
      if (data) {
        await supabase.from("monthly_loads").update({ km }).eq("athlete_id", athleteId!).eq("month_key", month);
      } else {
        await supabase.from("monthly_loads").insert({ athlete_id: athleteId!, month_key: month, km });
      }
    },
    onSuccess: inv,
  });

  const addRace = useMutation({
    mutationFn: async (r: { name: string; date: string; distanceKm: number; timeSec: number; active?: boolean }) => {
      const { error } = await supabase.from("races").insert({
        athlete_id: athleteId!, name: r.name, date: r.date,
        distance_km: r.distanceKm, time_sec: r.timeSec, active: !!r.active,
      });
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const updateRace = useMutation({
    mutationFn: async (r: Race) => {
      const { error } = await supabase.from("races").update({
        name: r.name, date: r.date, distance_km: r.distanceKm, time_sec: r.timeSec, active: !!r.active,
      }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const setActiveRace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("races").update({ active: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  const deleteRace = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("races").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: inv,
  });

  return { updateProfile, upsertTraining, deleteTraining, upsertReport, setMonthlyMacro, setMonthlyKm, addRace, updateRace, setActiveRace, deleteRace };
}

export function useCoachSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, whatsapp, displayName }: { coachId: string; whatsapp: string; displayName: string }) => {
      const { error } = await supabase.from("coach_settings").upsert(
        { coach_id: coachId, whatsapp, display_name: displayName } as never,
        { onConflict: "coach_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coach-settings"] }),
  });
}

// ============== STORAGE HELPERS ==============
export async function uploadCertificate(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/cert-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("medical-certificates").upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}
export async function signedCertUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("medical-certificates").createSignedUrl(path, 300);
  return data?.signedUrl || null;
}
export async function uploadReportPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("report-photos").upload(path, file);
  if (error) throw error;
  return path;
}
