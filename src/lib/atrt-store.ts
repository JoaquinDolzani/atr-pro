// Store + tipos para A Tu Ritmo Running Team. Persistencia: localStorage.
import { useEffect, useState, useCallback } from "react";

export type MacroPhase = "General" | "Pre-competitivo" | "Competitivo" | "Transición";
export type ZoneKey = "R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6";

export interface Race {
  id: string;
  date: string;        // ISO yyyy-mm-dd
  name: string;
  distanceKm: number;  // km
  timeSec: number;     // total seconds
  active?: boolean;    // marca activa
}

export interface TrainingBlock {
  ec: string;          // entrada en calor
  main: string;        // bloque principal
  vc: string;          // vuelta a la calma
  zone: ZoneKey;       // zona objetivo
}

export interface Report {
  date: string;
  links: string[];
  photos: string[];    // dataURLs
  km: number;
  timeMin: number;
  rpe: number;
  notes?: string;
}

export interface Athlete {
  id: string;
  name: string;
  email: string;
  photo?: string;
  certificateDate: string;        // ISO emisión
  objectives: string;
  macroByMonth: Record<string, MacroPhase>; // "YYYY-MM" -> phase
  monthlyKm: Record<string, number>;        // "YYYY-MM" -> km totales del mes
  races: Race[];
  monthsOwed: 0 | 1 | 2 | 3;
  trainings: Record<string, TrainingBlock>; // "YYYY-MM-DD" -> block
  reports: Record<string, Report>;          // "YYYY-MM-DD" -> report
}

export interface DB {
  coach: { name: string; whatsapp: string };
  athletes: Athlete[];
}

const KEY = "atrt_db_v1";

// ---------- Seed ----------
function todayIso() { return new Date().toISOString().slice(0, 10); }
function monthKey(d = new Date()) { return d.toISOString().slice(0, 7); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function seed(): DB {
  const now = new Date();
  const cm = monthKey(now);
  const prev1 = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const prev2 = monthKey(new Date(now.getFullYear(), now.getMonth() - 2, 1));
  const prev3 = monthKey(new Date(now.getFullYear(), now.getMonth() - 3, 1));

  // Certificado vencido (13 meses)
  const cert = new Date(now); cert.setMonth(cert.getMonth() - 13);

  // Entrenamiento de hoy
  const today = todayIso();
  const yesterday = addDays(now, -1).toISOString().slice(0, 10);

  const joaquin: Athlete = {
    id: "ath_joaquin",
    name: "Joaquín Dolzani",
    email: "joaquin@atururitmo.run",
    certificateDate: cert.toISOString().slice(0, 10),
    objectives: "Bajar de 33:30 en 10K y completar la Maratón de Buenos Aires en sub 2:50.",
    macroByMonth: { [cm]: "Pre-competitivo" },
    monthlyKm: {
      [`${now.getFullYear()}-01`]: 320,
      [`${now.getFullYear()}-02`]: 360,
      [`${now.getFullYear()}-03`]: 400,
      [`${now.getFullYear()}-04`]: 420,
      [prev3]: 340,
      [prev2]: 380,
      [prev1]: 410,
      [cm]: 145,
    },
    races: [
      { id: "r1", date: `${now.getFullYear() - 1}-10-15`, name: "10K Buenos Aires", distanceKm: 10, timeSec: 34 * 60 + 26, active: true },
      { id: "r2", date: `${now.getFullYear() - 1}-05-20`, name: "21K Rosario", distanceKm: 21.097, timeSec: 76 * 60 + 10 },
    ],
    monthsOwed: 0,
    trainings: {
      [today]: {
        ec: "15 min trote suave + movilidad articular + 4x80m progresivos.",
        main: "8 x 1000m a ritmo R5 con 2' de pausa trote. Mantener cadencia alta.",
        vc: "12 min trote regenerativo + elongación 10 min.",
        zone: "R5",
      },
      [yesterday]: {
        ec: "10 min trote + drills técnicos.",
        main: "Rodaje continuo de 50 min en R2.",
        vc: "5 min caminata + elongación.",
        zone: "R2",
      },
      [addDays(now, 2).toISOString().slice(0, 10)]: {
        ec: "20 min trote progresivo.",
        main: "Fartlek 6x(3'fuerte/2'suave) en R4.",
        vc: "10 min trote suave.",
        zone: "R4",
      },
    },
    reports: {
      [yesterday]: {
        date: yesterday,
        links: ["https://connect.garmin.com/modern/activity/123456789"],
        photos: [
          // Pequeños placeholders SVG en dataURL como "capturas"
          "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'><rect width='200' height='280' fill='%23111'/><text x='100' y='40' fill='%239fff7a' font-family='monospace' font-size='14' text-anchor='middle'>GARMIN</text><text x='100' y='130' fill='%23fff' font-family='monospace' font-size='28' text-anchor='middle'>10.2 km</text><text x='100' y='170' fill='%23fff' font-family='monospace' font-size='18' text-anchor='middle'>42:18</text><text x='100' y='210' fill='%239fff7a' font-family='monospace' font-size='14' text-anchor='middle'>4:09 /km</text></svg>`),
          "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 280'><rect width='200' height='280' fill='%23111'/><text x='100' y='40' fill='%23ff6b35' font-family='monospace' font-size='14' text-anchor='middle'>STRAVA</text><text x='100' y='130' fill='%23fff' font-family='monospace' font-size='28' text-anchor='middle'>FC 158</text><text x='100' y='170' fill='%23fff' font-family='monospace' font-size='18' text-anchor='middle'>RPE 7</text><text x='100' y='210' fill='%239fff7a' font-family='monospace' font-size='14' text-anchor='middle'>OK</text></svg>`),
        ],
        km: 10.2,
        timeMin: 42,
        rpe: 7,
        notes: "Piernas livianas, salí bien.",
      },
    },
  };

  return {
    coach: { name: "Coach Martín", whatsapp: "5491133334444" },
    athletes: [
      joaquin,
      {
        id: "ath_luna",
        name: "Luna García",
        email: "luna@atururitmo.run",
        certificateDate: addDays(now, -200).toISOString().slice(0, 10),
        objectives: "Terminar mi primera media maratón.",
        macroByMonth: { [cm]: "General" },
        monthlyKm: { [prev2]: 120, [prev1]: 140, [cm]: 60 },
        races: [],
        monthsOwed: 1,
        trainings: {},
        reports: {},
      },
      {
        id: "ath_diego",
        name: "Diego Pérez",
        email: "diego@atururitmo.run",
        certificateDate: addDays(now, -340).toISOString().slice(0, 10),
        objectives: "Mejorar mi marca en 5K.",
        macroByMonth: { [cm]: "Competitivo" },
        monthlyKm: { [prev2]: 220, [prev1]: 250, [cm]: 90 },
        races: [{ id: "r1", date: `${now.getFullYear()}-03-10`, name: "5K Palermo", distanceKm: 5, timeSec: 18 * 60 + 55, active: true }],
        monthsOwed: 3,
        trainings: {},
        reports: {},
      },
    ],
  };
}

function load(): DB {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { const s = seed(); localStorage.setItem(KEY, JSON.stringify(s)); return s; }
    return JSON.parse(raw);
  } catch { return seed(); }
}

const listeners = new Set<() => void>();

export function useDB(): [DB, (updater: (db: DB) => DB) => void] {
  const [db, setDb] = useState<DB>(() => load());
  useEffect(() => {
    const fn = () => setDb(load());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const update = useCallback((updater: (db: DB) => DB) => {
    const next = updater(load());
    localStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  }, []);
  return [db, update];
}

export function resetDB() {
  localStorage.removeItem(KEY);
  load();
  listeners.forEach((l) => l());
}

// ---------- Helpers ----------
export function monthsBetween(fromIso: string, to = new Date()): number {
  const f = new Date(fromIso);
  return (to.getFullYear() - f.getFullYear()) * 12 + (to.getMonth() - f.getMonth());
}
export function certStatus(iso: string): "ok" | "warn" | "bad" {
  const m = monthsBetween(iso);
  if (m >= 12) return "bad";
  if (m >= 11) return "warn";
  return "ok";
}
export function weekKmFor(a: Athlete): number {
  // suma reports últimos 7 días
  const now = new Date();
  let km = 0;
  for (const r of Object.values(a.reports)) {
    const d = new Date(r.date);
    const diff = (now.getTime() - d.getTime()) / 86400000;
    if (diff >= 0 && diff <= 7) km += r.km;
  }
  return km;
}
export function monthKm(a: Athlete, mk = monthKey()): number {
  return a.monthlyKm[mk] || 0;
}
export function activeRace(a: Athlete): Race | undefined {
  return a.races.find((r) => r.active) || a.races[0];
}
export function vam(a: Athlete): number | null {
  // VAM aproximada: velocidad (m/min) de la marca activa.
  const r = activeRace(a);
  if (!r) return null;
  return (r.distanceKm * 1000) / (r.timeSec / 60); // m/min
}
export function zones(a: Athlete): Record<ZoneKey, { pace: string; pct: string }> | null {
  const v = vam(a);
  if (!v) return null;
  // Porcentajes simplificados de VAM por zona
  const pcts: Record<ZoneKey, number> = { R0: 0.6, R1: 0.7, R2: 0.78, R3: 0.85, R4: 0.92, R5: 1.0, R6: 1.08 };
  const out = {} as Record<ZoneKey, { pace: string; pct: string }>;
  (Object.keys(pcts) as ZoneKey[]).forEach((k) => {
    const vk = v * pcts[k]; // m/min
    const secPerKm = 60000 / vk; // (1000m / vk) * 60
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60).toString().padStart(2, "0");
    out[k] = { pace: `${m}:${s} /km`, pct: `${Math.round(pcts[k] * 100)}%` };
  });
  return out;
}
export function paceForZone(a: Athlete, z: ZoneKey): string {
  const zs = zones(a);
  return zs ? zs[z].pace : "—";
}
export function fmtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}
export { monthKey };
