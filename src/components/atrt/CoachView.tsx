import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import {
  ChevronLeft, Activity, AlertTriangle, CheckCircle2, XCircle, DollarSign,
  LineChart as LineIcon, Trophy, Plus, Star, Settings, FileText, X, ClipboardList, Save,
  CalendarDays, Trash2, ChevronRight,
} from "lucide-react";
import {
  useDB, type Athlete, type MacroPhase, type ZoneKey, type SessionType, type Microcycle, type TrainingBlock, type Race,
  certStatus, weekKmFor, monthKm, monthKey, zones, vam, fmtTime, fmtDateAR, activeRace,
} from "../../lib/atrt-store";

const PHASES: MacroPhase[] = ["General", "Pre-competitivo", "Competitivo", "Transición"];
const SESSIONS: SessionType[] = ["Pasadas", "Fondo", "Tempo", "Fuerza", "Cuestas"];
const MICROS: Microcycle[] = ["Bajo", "Medio", "Alto"];

export function CoachView() {
  const [db, update] = useDB();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const selected = db.athletes.find((a) => a.id === selectedId) || null;

  if (selected) return <AthleteCard athleteId={selected.id} onBack={() => setSelectedId(null)} />;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/80">Coach</p>
          <h2 className="text-2xl font-bold">Panel de atletas</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)}
            className="bg-card border border-border hover:border-primary/60 rounded-full p-2 transition" title="Configuración">
            <Settings className="size-4 text-primary" />
          </button>
          <div className="text-right text-xs text-muted-foreground">
            <p>{db.athletes.length} corredores</p>
            <p className="text-primary">{monthKey()}</p>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {db.athletes.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/60 transition active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base truncate">{a.name}</h3>
                  <CertDot status={certStatus(a.certificateDate)} />
                  <PayDot owed={a.monthsOwed} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">DNI {a.dni || "—"} · Nac. {fmtDateAR(a.birthDate)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Macro: <span className="text-primary">{a.macroByMonth[monthKey()] || "—"}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Semana</p>
                <p className="font-bold text-primary glow-text">{weekKmFor(a).toFixed(1)} km</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Mes</p>
                <p className="font-semibold">{monthKm(a)} km</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {showSettings && (
        <SettingsModal
          initial={db.coach}
          onClose={() => setShowSettings(false)}
          onSave={(coach) => { update((d) => ({ ...d, coach })); setShowSettings(false); }}
        />
      )}
    </div>
  );
}

function SettingsModal({ initial, onClose, onSave }: { initial: { name: string; whatsapp: string }; onClose: () => void; onSave: (c: { name: string; whatsapp: string }) => void }) {
  const [name, setName] = useState(initial.name);
  const [wa, setWa] = useState(initial.whatsapp);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="size-5 text-primary" /> Configuración</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-primary">Nombre del entrenador</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-primary">Número de WhatsApp del entrenador</label>
          <input value={wa} onChange={(e) => setWa(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ej: 5491133334444 (con código de país, sin +)"
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono" />
          <p className="text-[11px] text-muted-foreground mt-1">Se usará en el botón de WhatsApp del atleta para enviar reportes.</p>
        </div>
        <button onClick={() => onSave({ name, whatsapp: wa })}
          className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow flex items-center justify-center gap-2">
          <Save className="size-4" /> Guardar configuración
        </button>
      </div>
    </div>
  );
}

function CertDot({ status }: { status: "ok" | "warn" | "bad" }) {
  const cls = status === "ok" ? "bg-success" : status === "warn" ? "bg-warn" : "bg-destructive";
  const Icon = status === "ok" ? CheckCircle2 : status === "warn" ? AlertTriangle : XCircle;
  return <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${cls}/20 border border-current/40`}>
    <Icon className={`size-3 ${status === "ok" ? "text-success" : status === "warn" ? "text-warn" : "text-destructive"}`} />
  </span>;
}
function PayDot({ owed }: { owed: number }) {
  const color = owed === 0 ? "text-success" : owed < 3 ? "text-warn" : "text-destructive";
  return <span className={`inline-flex items-center gap-0.5 text-[10px] ${color}`}>
    <DollarSign className="size-3" />{owed > 0 ? owed : "✓"}
  </span>;
}

function AthleteCard({ athleteId, onBack }: { athleteId: string; onBack: () => void }) {
  const [db, update] = useDB();
  const a = db.athletes.find((x) => x.id === athleteId)!;
  const [showCert, setShowCert] = useState(false);
  const [editVAM, setEditVAM] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);

  const patch = (mut: (a: Athlete) => Athlete) => {
    update((d) => ({ ...d, athletes: d.athletes.map((x) => x.id === athleteId ? mut(x) : x) }));
  };

  const cm = monthKey();
  const [selectedMonth, setSelectedMonth] = useState<string>(cm);
  const phase = a.macroByMonth[selectedMonth] || "General";
  const zs = zones(a);
  const v = vam(a);
  const ar = activeRace(a);
  const cs = certStatus(a.certificateDate);

  const chartData = useMemo(() => {
    return Object.entries(a.monthlyKm)
      .sort(([x], [y]) => x.localeCompare(y))
      .slice(-8)
      .map(([k, v]) => ({ month: k.slice(2), km: v, key: k }));
  }, [a.monthlyKm]);

  return (
    <div className="space-y-4 pb-8">
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm">
        <ChevronLeft className="size-4" /> Volver
      </button>

      {/* Cabecera: datos personales */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-primary">Ficha técnica</p>
            <h2 className="text-2xl font-bold truncate">{a.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">DNI <span className="text-foreground">{a.dni || "—"}</span> · Nac. <span className="text-foreground">{fmtDateAR(a.birthDate)}</span></p>
            <p className="text-[11px] text-muted-foreground">{a.email}</p>
          </div>
          <div className="flex gap-2 shrink-0"><CertDot status={cs} /><PayDot owed={a.monthsOwed} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <Stat label="Semana" value={`${weekKmFor(a).toFixed(1)}km`} />
          <Stat label="Mes" value={`${monthKm(a)}km`} />
          <Stat label="VAM" value={v ? `${v.toFixed(0)} m/min` : "—"} />
        </div>
      </div>

      {/* Auditoría de salud */}
      <Section icon={<AlertTriangle className="size-4" />} title="Auditoría de salud">
        <div className={`rounded-lg p-3 text-sm border ${cs === "bad" ? "bg-destructive/15 border-destructive text-destructive" : cs === "warn" ? "bg-warn/15 border-warn/50 text-warn" : "bg-success/10 border-success/40 text-success"}`}>
          {cs === "bad" && <p className="font-semibold">CERTIFICADO VENCIDO — requiere renovación inmediata.</p>}
          {cs === "warn" && <p>Certificado próximo a vencer.</p>}
          {cs === "ok" && <p>Certificado médico vigente.</p>}
          <p className="text-[11px] opacity-80 mt-0.5">Emitido: {fmtDateAR(a.certificateDate)}</p>
        </div>
        <button onClick={() => setShowCert(true)} disabled={!a.certificateFile}
          className="mt-2 w-full bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-sm py-2.5 rounded-lg flex items-center justify-center gap-2">
          <FileText className="size-4 text-primary" /> 📄 Ver Certificado Médico
        </button>
        {!a.certificateFile && <p className="text-[11px] text-muted-foreground mt-1">El atleta aún no subió el archivo del certificado.</p>}
      </Section>

      {/* Carga mensual + Macrociclo integrado */}
      <Section icon={<LineIcon className="size-4" />} title="Carga mensual">
        <p className="text-[11px] text-muted-foreground mb-1">Tocá una barra para seleccionar el mes y editar su macrociclo.</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.015 240)" />
              <XAxis dataKey="month" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="km" radius={[6, 6, 0, 0]} onClick={(d: { key: string }) => setSelectedMonth(d.key)} cursor="pointer">
                {chartData.map((d) => (
                  <Cell key={d.key} fill={d.key === selectedMonth ? "oklch(0.92 0.22 145)" : "oklch(0.55 0.12 145 / 0.55)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
            <Activity className="size-3" /> Macrociclo · <span className="text-foreground">{selectedMonth}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PHASES.map((p) => (
              <button
                key={p}
                onClick={() => patch((x) => ({ ...x, macroByMonth: { ...x.macroByMonth, [selectedMonth]: p } }))}
                className={`p-2 rounded-lg text-sm border transition ${phase === p ? "bg-primary text-primary-foreground border-primary glow" : "border-border hover:border-primary/60"}`}
              >{p}</button>
            ))}
          </div>
        </div>
      </Section>


      {/* Calculadora VAM */}
      <Section icon={<Activity className="size-4" />} title="Calculadora de intensidades (VAM)">
        {ar ? (
          <div className="text-xs text-muted-foreground mb-2">
            Marca activa: <span className="text-foreground">{ar.distanceKm}km en {fmtTime(ar.timeSec)}</span>
          </div>
        ) : <p className="text-xs text-muted-foreground mb-2">Sin marca activa.</p>}
        <button onClick={() => setEditVAM((s) => !s)} className="text-xs text-primary mb-2">
          {editVAM ? "Cerrar edición" : "Editar marca base"}
        </button>
        {editVAM && ar && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input type="number" step="0.1" defaultValue={ar.distanceKm} placeholder="km"
              onBlur={(e) => patch((x) => ({ ...x, races: x.races.map((r) => r.id === ar.id ? { ...r, distanceKm: +e.target.value } : r) }))}
              className="bg-input border border-border rounded px-2 py-1 text-sm" />
            <input type="number" defaultValue={Math.floor(ar.timeSec / 60)} placeholder="min"
              onBlur={(e) => patch((x) => ({ ...x, races: x.races.map((r) => r.id === ar.id ? { ...r, timeSec: +e.target.value * 60 + (ar.timeSec % 60) } : r) }))}
              className="bg-input border border-border rounded px-2 py-1 text-sm" />
            <input type="number" defaultValue={ar.timeSec % 60} placeholder="seg"
              onBlur={(e) => patch((x) => ({ ...x, races: x.races.map((r) => r.id === ar.id ? { ...r, timeSec: Math.floor(ar.timeSec / 60) * 60 + +e.target.value } : r) }))}
              className="bg-input border border-border rounded px-2 py-1 text-sm" />
          </div>
        )}
        {zs && (
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(zs) as ZoneKey[]).map((k) => (
              <div key={k} className="bg-secondary rounded-lg p-2 flex items-center justify-between">
                <span className="font-bold text-primary">{k}</span>
                <div className="text-right">
                  <p className="text-xs font-mono">{zs[k].pace}</p>
                  <p className="text-[10px] text-muted-foreground">{zs[k].pct}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Pagos */}
      <Section icon={<DollarSign className="size-4" />} title="Gestión de pagos">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => patch((x) => ({ ...x, monthsOwed: n as 0 | 1 | 2 | 3 }))}
              className={`py-2 rounded-lg text-sm border transition ${a.monthsOwed === n ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
            >{n === 3 ? "3+" : n}</button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Meses adeudados. 3+ suspende la cuenta del atleta.</p>
      </Section>

      {/* Marcas */}
      <Section icon={<Trophy className="size-4" />} title="Registro de marcas">
        <div className="space-y-2">
          {a.races.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-secondary rounded-lg p-2">
              <button
                onClick={(e) => { e.stopPropagation(); patch((x) => ({ ...x, races: x.races.map((rr) => ({ ...rr, active: rr.id === r.id })) })); }}
                className={r.active ? "text-primary" : "text-muted-foreground"}
                title="Marca activa"
              ><Star className={`size-4 ${r.active ? "fill-current" : ""}`} /></button>
              <button
                onClick={() => setEditingRaceId(r.id)}
                className="flex-1 min-w-0 text-left hover:opacity-80 transition"
              >
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.date} · {r.distanceKm}km · {fmtTime(r.timeSec)}</p>
              </button>
            </div>
          ))}
        </div>
        <AddRace onAdd={(r) => patch((x) => ({ ...x, races: [...x.races, r] }))} />
      </Section>

      {/* Cargar entrenamiento */}
      <TrainingPlanner
        trainings={a.trainings}
        onSave={(date, block) => patch((x) => ({ ...x, trainings: { ...x.trainings, [date]: block } }))}
        onDelete={(date) => patch((x) => { const t = { ...x.trainings }; delete t[date]; return { ...x, trainings: t }; })}
      />

      {showCert && a.certificateFile && (
        <CertModal src={a.certificateFile} onClose={() => setShowCert(false)} />
      )}
      {editingRaceId && (() => {
        const race = a.races.find((r) => r.id === editingRaceId);
        if (!race) return null;
        return (
          <EditRaceModal
            race={race}
            onClose={() => setEditingRaceId(null)}
            onSave={(updated) => {
              patch((x) => ({ ...x, races: x.races.map((r) => r.id === updated.id ? updated : r) }));
              setEditingRaceId(null);
            }}
            onDelete={() => {
              patch((x) => ({ ...x, races: x.races.filter((r) => r.id !== editingRaceId) }));
              setEditingRaceId(null);
            }}
          />
        );
      })()}
    </div>
  );
}

function CertModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white"><X className="size-6" /></button>
        <div className="bg-card border border-primary/40 rounded-2xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-primary mb-2 text-center">Certificado Médico</p>
          <img src={src} alt="Certificado médico" className="w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

type PlannerProps = {
  trainings: Record<string, TrainingBlock>;
  onSave: (date: string, block: TrainingBlock) => void;
  onDelete: (date: string) => void;
};

const EMPTY_BLOCK: TrainingBlock = {
  ec: "", main: "", vc: "", zone: "R3",
  sessionType: "Pasadas", microcycle: "Medio", plannedKm: 0,
};

function toIso(d: Date) { return d.toISOString().slice(0, 10); }

function buildMonthWeeks(viewMonth: Date) {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = first.getDay(); // 0=Dom
  const start = new Date(first); start.setDate(first.getDate() - startOffset);
  const weeks: Date[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
    // si ya pasamos completamente al siguiente mes y no es la primera fila, cortamos
    if (row[6].getMonth() !== viewMonth.getMonth() && row[0].getMonth() !== viewMonth.getMonth()) break;
  }
  return weeks;
}

function TrainingPlanner({ trainings, onSave, onDelete }: PlannerProps) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(toIso(today));
  const [form, setForm] = useState<TrainingBlock>(() => trainings[toIso(today)] || EMPTY_BLOCK);
  const [msg, setMsg] = useState<string | null>(null);

  const isEdit = !!trainings[selectedDate];

  const selectDay = (d: Date) => {
    const iso = toIso(d);
    setSelectedDate(iso);
    setForm(trainings[iso] ? { ...EMPTY_BLOCK, ...trainings[iso] } : EMPTY_BLOCK);
    setMsg(null);
  };

  const weeks = useMemo(() => buildMonthWeeks(viewMonth), [viewMonth]);

  const save = () => {
    if (!form.ec.trim() || !form.main.trim() || !form.vc.trim()) {
      setMsg("Completá los 3 bloques (EC, Principal, VC)."); return;
    }
    onSave(selectedDate, form);
    setMsg(isEdit ? "✓ Cambios guardados" : "✓ Sesión asignada");
    setTimeout(() => setMsg(null), 2000);
  };

  const remove = () => {
    if (!isEdit) return;
    onDelete(selectedDate);
    setForm(EMPTY_BLOCK);
    setMsg("🗑️ Sesión eliminada");
    setTimeout(() => setMsg(null), 2000);
  };

  const monthLabel = viewMonth.toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  return (
    <Section icon={<ClipboardList className="size-4" />} title="Planificación de entrenamientos">
      {/* Calendario */}
      <div className="bg-secondary/40 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
            className="p-1 rounded hover:bg-secondary"><ChevronLeft className="size-4" /></button>
          <p className="text-sm font-semibold flex items-center gap-1 capitalize">
            <CalendarDays className="size-4 text-primary" />{monthLabel}
          </p>
          <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            className="p-1 rounded hover:bg-secondary"><ChevronRight className="size-4" /></button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground text-center mb-1">
              {["D","L","M","X","J","V","S"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="space-y-1">
              {weeks.map((row, i) => (
                <div key={i} className="grid grid-cols-7 gap-1">
                  {row.map((d) => {
                    const iso = toIso(d);
                    const inMonth = d.getMonth() === viewMonth.getMonth();
                    const has = !!trainings[iso];
                    const selected = iso === selectedDate;
                    return (
                      <button key={iso} onClick={() => selectDay(d)}
                        className={`aspect-square rounded-md text-[11px] flex flex-col items-center justify-center transition
                          ${selected ? "bg-primary text-primary-foreground glow font-bold"
                            : has ? "bg-primary/20 border border-primary/60 text-foreground"
                            : inMonth ? "bg-card border border-border" : "text-muted-foreground/40"}`}>
                        <span>{d.getDate()}</span>
                        {has && !selected && <span className="size-1 rounded-full bg-primary mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1 pt-[22px]">
            {weeks.map((row, i) => {
              const km = row.reduce((acc, d) => acc + (trainings[toIso(d)]?.plannedKm || 0), 0);
              return (
                <div key={i} className="aspect-square min-w-[44px] rounded-md bg-card border border-border flex flex-col items-center justify-center text-center px-1">
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground leading-none">Sem</span>
                  <span className={`text-xs font-bold leading-tight ${km > 0 ? "text-primary" : "text-muted-foreground"}`}>{km}</span>
                  <span className="text-[8px] text-muted-foreground leading-none">km</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-primary">
            {isEdit ? "Editando sesión" : "Nueva sesión"} · <span className="text-foreground">{fmtDateAR(selectedDate)}</span>
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo</label>
            <select value={form.sessionType} onChange={(e) => setForm({ ...form, sessionType: e.target.value as SessionType })}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm mt-1">
              {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Microciclo</label>
            <select value={form.microcycle} onChange={(e) => setForm({ ...form, microcycle: e.target.value as Microcycle })}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm mt-1">
              {MICROS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Zona</label>
            <select value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value as ZoneKey })}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm mt-1">
              {(["R0","R1","R2","R3","R4","R5","R6"] as ZoneKey[]).map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Km planificados</label>
          <input type="number" min={0} step="0.5" value={form.plannedKm ?? 0}
            onChange={(e) => setForm({ ...form, plannedKm: +e.target.value })}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-primary">1) Entrada en Calor (EC)</label>
          <textarea value={form.ec} onChange={(e) => setForm({ ...form, ec: e.target.value })} rows={2}
            placeholder="Ej: 15' trote suave + movilidad + 4x80m progresivos."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-primary">2) Bloque Principal</label>
          <textarea value={form.main} onChange={(e) => setForm({ ...form, main: e.target.value })} rows={3}
            placeholder="Ej: 8 x 1000m en R5 con 2' pausa trote."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-primary">3) Vuelta a la Calma (VC)</label>
          <textarea value={form.vc} onChange={(e) => setForm({ ...form, vc: e.target.value })} rows={2}
            placeholder="Ej: 10' trote regenerativo + elongación."
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
      </div>

      {msg && <p className={`text-xs mt-2 ${msg.startsWith("✓") ? "text-success" : msg.startsWith("🗑️") ? "text-warn" : "text-destructive"}`}>{msg}</p>}

      <div className="mt-3 flex gap-2">
        <button onClick={save}
          className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl glow flex items-center justify-center gap-2">
          {isEdit ? <><Save className="size-4" /> 💾 Guardar Cambios</> : <><Plus className="size-4" /> + Asignar</>}
        </button>
        {isEdit && (
          <button onClick={remove}
            className="px-4 bg-destructive/20 text-destructive border border-destructive/50 font-semibold rounded-xl flex items-center justify-center gap-1">
            <Trash2 className="size-4" /> Eliminar
          </button>
        )}
      </div>
    </Section>
  );
}


function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/60 rounded-lg p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-bold text-primary">{value}</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-2xl p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary mb-3">{icon}{title}</h3>
      {children}
    </section>
  );
}

function AddRace({ onAdd }: { onAdd: (r: import("../../lib/atrt-store").Race) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: "", name: "", distanceKm: 10, min: 0, sec: 0 });
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2 flex items-center gap-1 text-primary text-xs"><Plus className="size-3" /> Agregar marca</button>;
  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-input border border-border rounded px-2 py-1 text-sm" />
      <input placeholder="Nombre carrera" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-input border border-border rounded px-2 py-1 text-sm" />
      <div className="grid grid-cols-3 gap-2">
        <input type="number" step="0.1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: +e.target.value })} placeholder="km" className="bg-input border border-border rounded px-2 py-1 text-sm" />
        <input type="number" value={form.min} onChange={(e) => setForm({ ...form, min: +e.target.value })} placeholder="min" className="bg-input border border-border rounded px-2 py-1 text-sm" />
        <input type="number" value={form.sec} onChange={(e) => setForm({ ...form, sec: +e.target.value })} placeholder="seg" className="bg-input border border-border rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => { onAdd({ id: crypto.randomUUID(), date: form.date, name: form.name, distanceKm: form.distanceKm, timeSec: form.min * 60 + form.sec }); setOpen(false); }} className="flex-1 bg-primary text-primary-foreground rounded py-1.5 text-sm font-semibold">Guardar</button>
        <button onClick={() => setOpen(false)} className="px-3 bg-secondary rounded py-1.5 text-sm">Cancelar</button>
      </div>
    </div>
  );
}
