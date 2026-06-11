// Helpers puros para A Tu Ritmo Running Team. Sin localStorage ni IO.

export type MacroPhase = "General" | "Pre-competitivo" | "Competitivo" | "Transición";
export type ZoneKey = "R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6";
export type SessionType = "Pasadas" | "Fondo" | "Tempo" | "Fuerza" | "Cuestas";
export type Microcycle = "Bajo" | "Medio" | "Alto";

export interface Race {
  id: string;
  date: string;
  name: string;
  distanceKm: number;
  timeSec: number;
  active?: boolean;
}

export interface TrainingBlock {
  ec: string;
  main: string;
  vc: string;
  zone: ZoneKey;
  sessionType?: SessionType;
  microcycle?: Microcycle;
  plannedKm?: number;
  completed?: boolean;
}

export interface Report {
  date: string;
  links: string[];
  photos: string[];          // signed URLs (display) o paths
  km: number;
  timeMin: number;
  rpe: number;
  notes?: string;
}

export interface Payment { monthKey: string; paid: boolean; }

export interface Athlete {
  id: string;
  name: string;
  email: string;
  dni: string;
  birthDate: string;
  certificateDate: string;
  certificatePath?: string;
  avatarPath?: string;
  isActive: boolean;
  objectives: string;
  monthsOwed: 0 | 1 | 2 | 3;
  macroByMonth: Record<string, MacroPhase>;
  monthlyKm: Record<string, number>;
  races: Race[];
  trainings: Record<string, TrainingBlock>;
  reports: Record<string, Report>;
  payments: Record<string, boolean>;
}

export function lastMonthKeys(n = 6): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    const k = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    out.unshift(k);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

// Dynamic list: from earliest of {first recorded payment, Jan of current year} up to current month.
export function paymentMonthKeys(recorded: Record<string, boolean> = {}): string[] {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  const keys = Object.keys(recorded);
  let startY = curY, startM = 0; // default: Jan current year
  if (keys.length) {
    const sorted = [...keys].sort();
    const [y, m] = sorted[0].split("-").map(Number);
    if (y < startY || (y === startY && m - 1 < startM)) { startY = y; startM = m - 1; }
  }
  const out: string[] = [];
  let y = startY, m = startM;
  while (y < curY || (y === curY && m <= curM)) {
    out.push(`${y}-${(m + 1).toString().padStart(2, "0")}`);
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return out;
}

export function monthLabel(mk: string): string {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const s = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
export function monthsBetween(fromIso: string, to = new Date()): number {
  if (!fromIso) return 0;
  const f = new Date(fromIso);
  return (to.getFullYear() - f.getFullYear()) * 12 + (to.getMonth() - f.getMonth());
}
export function certStatus(iso: string): "ok" | "warn" | "bad" {
  if (!iso) return "bad";
  const m = monthsBetween(iso);
  if (m >= 12) return "bad";
  if (m >= 11) return "warn";
  return "ok";
}
export function weekKmFor(a: Athlete): number {
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
  const r = activeRace(a);
  if (!r) return null;
  return (r.distanceKm * 1000) / (r.timeSec / 60);
}
export function zones(a: Athlete): Record<ZoneKey, { pace: string; pct: string }> | null {
  const v = vam(a);
  if (!v) return null;
  const pcts: Record<ZoneKey, number> = { R0: 0.6, R1: 0.7, R2: 0.78, R3: 0.85, R4: 0.92, R5: 1.0, R6: 1.08 };
  const out = {} as Record<ZoneKey, { pace: string; pct: string }>;
  (Object.keys(pcts) as ZoneKey[]).forEach((k) => {
    const vk = v * pcts[k];
    const secPerKm = 60000 / vk;
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
export function fmtDateAR(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
