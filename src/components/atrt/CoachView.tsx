import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ChevronLeft, Activity, AlertTriangle, CheckCircle2, XCircle, DollarSign, LineChart as LineIcon, Trophy, Plus, Star } from "lucide-react";
import {
  useDB, type Athlete, type MacroPhase, type ZoneKey,
  certStatus, weekKmFor, monthKm, monthKey, zones, vam, fmtTime, activeRace,
} from "../../lib/atrt-store";

const PHASES: MacroPhase[] = ["General", "Pre-competitivo", "Competitivo", "Transición"];

export function CoachView() {
  const [db] = useDB();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = db.athletes.find((a) => a.id === selectedId) || null;

  if (selected) return <AthleteCard athleteId={selected.id} onBack={() => setSelectedId(null)} />;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary/80">Coach</p>
          <h2 className="text-2xl font-bold">Panel de atletas</h2>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{db.athletes.length} corredores</p>
          <p className="text-primary">{monthKey()}</p>
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
  const [showChart, setShowChart] = useState(false);
  const [editVAM, setEditVAM] = useState(false);

  const patch = (mut: (a: Athlete) => Athlete) => {
    update((d) => ({ ...d, athletes: d.athletes.map((x) => x.id === athleteId ? mut(x) : x) }));
  };

  const cm = monthKey();
  const phase = a.macroByMonth[cm] || "General";
  const zs = zones(a);
  const v = vam(a);
  const ar = activeRace(a);

  const chartData = useMemo(() => {
    return Object.entries(a.monthlyKm)
      .sort(([x], [y]) => x.localeCompare(y))
      .slice(-8)
      .map(([k, v]) => ({ month: k.slice(2), km: v }));
  }, [a.monthlyKm]);

  return (
    <div className="space-y-4 pb-8">
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm">
        <ChevronLeft className="size-4" /> Volver
      </button>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-primary">Ficha técnica</p>
            <h2 className="text-2xl font-bold">{a.name}</h2>
            <p className="text-xs text-muted-foreground">{a.email}</p>
          </div>
          <div className="flex gap-2"><CertDot status={certStatus(a.certificateDate)} /><PayDot owed={a.monthsOwed} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <Stat label="Semana" value={`${weekKmFor(a).toFixed(1)}km`} />
          <Stat label="Mes" value={`${monthKm(a)}km`} />
          <Stat label="VAM" value={v ? `${v.toFixed(0)} m/min` : "—"} />
        </div>
      </div>

      {/* Macrociclo */}
      <Section icon={<Activity className="size-4" />} title="Macrociclo del mes">
        <div className="grid grid-cols-2 gap-2">
          {PHASES.map((p) => (
            <button
              key={p}
              onClick={() => patch((x) => ({ ...x, macroByMonth: { ...x.macroByMonth, [cm]: p } }))}
              className={`p-2 rounded-lg text-sm border transition ${phase === p ? "bg-primary text-primary-foreground border-primary glow" : "border-border hover:border-primary/60"}`}
            >{p}</button>
          ))}
        </div>
      </Section>

      {/* Gráfico carga mensual */}
      <Section icon={<LineIcon className="size-4" />} title="Carga mensual">
        <button onClick={() => setShowChart((s) => !s)} className="w-full bg-secondary hover:bg-secondary/80 text-sm py-2 rounded-lg">
          {showChart ? "Ocultar gráfico" : "Ver progresión de km"}
        </button>
        {showChart && (
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.015 240)" />
                <XAxis dataKey="month" stroke="#999" fontSize={11} />
                <YAxis stroke="#999" fontSize={11} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8 }} />
                <Bar dataKey="km" fill="oklch(0.92 0.22 145)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
                onClick={() => patch((x) => ({ ...x, races: x.races.map((rr) => ({ ...rr, active: rr.id === r.id })) }))}
                className={r.active ? "text-primary" : "text-muted-foreground"}
                title="Marca activa"
              ><Star className={`size-4 ${r.active ? "fill-current" : ""}`} /></button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.date} · {r.distanceKm}km · {fmtTime(r.timeSec)}</p>
              </div>
            </div>
          ))}
        </div>
        <AddRace onAdd={(r) => patch((x) => ({ ...x, races: [...x.races, r] }))} />
      </Section>
    </div>
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
