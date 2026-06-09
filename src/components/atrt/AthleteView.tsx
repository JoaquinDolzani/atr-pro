import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, XCircle, Calendar as CalIcon, Flame, Wind, Activity, MessageCircle, Plus, Trophy, User, Upload, Link2, X, FileText, Send, Camera } from "lucide-react";
import {
  certStatus, monthsBetween, activeRace, fmtTime, fmtDateAR, paceForZone,
  type Report,
} from "@/lib/atrt-derive";
import { useAuth, useAthlete, useCoachSettings, useMutations, uploadCertificate, uploadReportPhoto, uploadAvatar, signedAvatarUrl } from "@/lib/atrt-data";

function waLink(number: string, text: string) {
  const clean = (number || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}
function reportMessage(athleteId: string, date: string, km: number, timeMin: number, rpe: number) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/?role=coach&athleteId=${athleteId}&date=${date}`;
  return `¡Hola Coach! Te paso el reporte de mi entrenamiento del día ${fmtDateAR(date)}.

🏃‍♂️ Km reales: ${km}
⏱️ Tiempo total: ${timeMin} min
📈 RPE (Esfuerzo): ${rpe}/10

🔗 Revisá las capturas y enlaces ingresando acá: ${link}`;
}

export function AthleteView({ athleteId }: { athleteId: string }) {
  const auth = useAuth();
  const q = useAthlete(athleteId);
  const settings = useCoachSettings();
  const m = useMutations(athleteId);
  const [tab, setTab] = useState<"home" | "profile">("home");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (q.isLoading || !q.data) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  const a = q.data;
  const coachWa = settings.data?.whatsapp || "";
  const cert = certStatus(a.certificateDate);
  const certMonths = monthsBetween(a.certificateDate);
  const isMine = auth.userId === athleteId;

  return (
    <div className="space-y-4 pb-8">
      <div className="flex gap-2 bg-card border border-border rounded-full p-1">
        {([["home", "Inicio"], ["profile", "Mi perfil"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 py-1.5 rounded-full text-sm transition ${tab === k ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {mounted && cert === "warn" && (
        <div className="bg-warn/15 border border-warn/50 text-warn rounded-xl p-3 text-sm flex gap-2 items-start">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <p>Próximo a vencer: certificado médico con {certMonths} {certMonths === 1 ? "mes" : "meses"}.</p>
        </div>
      )}
      {mounted && cert === "bad" && (
        <div className="bg-destructive/15 border border-destructive text-destructive rounded-xl p-3 text-sm flex gap-2 items-start">
          <XCircle className="size-4 mt-0.5 shrink-0" />
          <p className="font-semibold">Certificado vencido — presentá uno nuevo.</p>
        </div>
      )}

      {tab === "home"
        ? <HomeTab a={a} coachWa={coachWa} onSaveReport={(r) => m.upsertReport.mutateAsync(r)} />
        : <ProfileTab a={a} isMine={isMine}
            onUpdate={(p) => m.updateProfile.mutateAsync(p)}
            onUploadAvatar={async (file) => {
              const path = await uploadAvatar(athleteId, file);
              await m.updateProfile.mutateAsync({ avatar_path: path });
            }}
            onUploadCert={async (file, date) => {
              const path = await uploadCertificate(athleteId, file);
              await m.updateProfile.mutateAsync({ certificate_path: path, certificate_date: date });
            }} />
      }
    </div>
  );
}

function HomeTab({ a, coachWa, onSaveReport }: {
  a: ReturnType<typeof useAthlete>["data"] & object;
  coachWa: string;
  onSaveReport: (r: { date: string; km: number; timeMin: number; rpe: number; notes?: string; links: string[]; photos: string[] }) => Promise<void>;
}) {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string>(new Date().toISOString().slice(0, 10));
  const [showReport, setShowReport] = useState(false);
  const days = useMemo(() => buildCalendar(cursor), [cursor]);
  const training = a.trainings[selected];
  const report = a.reports[selected];
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(cursor),
    [cursor]
  );

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="text-primary px-2">‹</button>
          <h3 key={cursor.getTime()} className="font-semibold text-sm flex items-center gap-2 capitalize"><CalIcon className="size-4 text-primary" />
            {monthLabel}
          </h3>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="text-primary px-2">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
          {["L","M","M","J","V","S","D"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const hasT = !!a.trainings[d.iso];
            const hasR = !!a.reports[d.iso];
            const isSel = d.iso === selected;
            const isToday = d.iso === new Date().toISOString().slice(0, 10);
            return (
              <button key={i} onClick={() => setSelected(d.iso)}
                className={`aspect-square rounded-lg text-xs relative flex items-center justify-center transition
                  ${isSel ? "bg-primary text-primary-foreground font-bold glow" : isToday ? "border border-primary text-primary" : "bg-secondary/40"}`}>
                {d.day}
                {(hasT || hasR) && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full ${hasR ? "bg-success" : isSel ? "bg-primary-foreground" : "bg-primary"}`} />}
              </button>
            );
          })}
        </div>
      </section>

      {training ? (
        <div className="space-y-3">
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-widest text-primary">Ritmo objetivo · Zona {training.zone}</p>
            <p className="text-2xl font-bold glow-text text-primary">{paceForZone(a, training.zone)}</p>
          </div>
          <Block icon={<Flame className="size-4" />} title="Entrada en calor" body={training.ec} />
          <Block icon={<Activity className="size-4" />} title="Bloque principal" body={training.main} primary />
          <Block icon={<Wind className="size-4" />} title="Vuelta a la calma" body={training.vc} />
          <button onClick={() => setShowReport(true)}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 glow">
            <Plus className="size-4" /> Registrar entrenamiento
          </button>
          {report && <ReportCard report={report} athleteId={a.id} coachWa={coachWa} />}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
          Sin entrenamiento asignado para este día.
        </div>
      )}

      {coachWa ? (
        <a href={waLink(coachWa, `Hola Coach! Soy ${a.name}. Consulta del ${fmtDateAR(selected)}.`)} target="_blank" rel="noreferrer"
          className="w-full bg-success/20 border border-success text-success font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <MessageCircle className="size-4" /> Hablar con el coach
        </a>
      ) : (
        <div className="w-full bg-secondary/40 border border-border text-muted-foreground text-xs py-3 rounded-xl text-center">
          El coach aún no configuró su WhatsApp.
        </div>
      )}

      {showReport && (
        <ReportModal date={selected} existing={report} athleteId={a.id}
          onClose={() => setShowReport(false)}
          onSave={async (r) => { await onSaveReport(r); setShowReport(false); }} />
      )}
    </div>
  );
}

function Block({ icon, title, body, primary }: { icon: React.ReactNode; title: string; body: string; primary?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${primary ? "bg-card border-primary/40" : "bg-card border-border"}`}>
      <h4 className={`text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1 ${primary ? "text-primary" : "text-muted-foreground"}`}>{icon}{title}</h4>
      <p className="text-sm leading-snug whitespace-pre-wrap">{body}</p>
    </div>
  );
}

function ReportCard({ report, athleteId, coachWa }: { report: Report; athleteId: string; coachWa: string }) {
  return (
    <div className="bg-success/10 border border-success/40 rounded-xl p-3 space-y-2">
      <p className="text-xs uppercase tracking-widest text-success">Entrenamiento reportado</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div><p className="text-[10px] text-muted-foreground">KM</p><p className="font-bold">{report.km}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Tiempo</p><p className="font-bold">{report.timeMin}'</p></div>
        <div><p className="text-[10px] text-muted-foreground">RPE</p><p className="font-bold">{report.rpe}/10</p></div>
      </div>
      {report.links.length > 0 && (
        <div className="space-y-1">
          {report.links.map((l, i) => (
            <a key={i} href={l} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary truncate">
              <Link2 className="size-3 shrink-0" /> <span className="truncate">{l}</span>
            </a>
          ))}
        </div>
      )}
      {report.photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {report.photos.map((p, i) => (
            <img key={i} src={p} alt="" className="h-24 rounded-lg border border-border" />
          ))}
        </div>
      )}
      {report.notes && <p className="text-xs text-muted-foreground italic">"{report.notes}"</p>}
      {coachWa && (
        <a href={waLink(coachWa, reportMessage(athleteId, report.date, report.km, report.timeMin, report.rpe))} target="_blank" rel="noreferrer"
          className="mt-1 w-full bg-success text-primary-foreground font-semibold py-2 rounded-lg flex items-center justify-center gap-2 text-sm">
          <Send className="size-4" /> Enviar reporte por WhatsApp
        </a>
      )}
    </div>
  );
}

function ReportModal({ date, existing, athleteId, onClose, onSave }: {
  date: string; existing?: Report; athleteId: string;
  onClose: () => void;
  onSave: (r: { date: string; km: number; timeMin: number; rpe: number; notes?: string; links: string[]; photos: string[] }) => Promise<void>;
}) {
  const [links, setLinks] = useState<string[]>(existing?.links || [""]);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>(existing?.photos || []);
  const [km, setKm] = useState(existing?.km ?? 0);
  const [timeMin, setTimeMin] = useState(existing?.timeMin ?? 0);
  const [rpe, setRpe] = useState(existing?.rpe ?? 5);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    for (const f of Array.from(files)) {
      try {
        const path = await uploadReportPhoto(athleteId, f);
        setPhotoPaths((p) => [...p, path]);
        setPreviews((p) => [...p, URL.createObjectURL(f)]);
      } catch (e) { console.error(e); }
    }
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ date, links: links.filter(Boolean), photos: photoPaths, km, timeMin, rpe, notes });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto p-5 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Registrar entrenamiento</h3>
          <button onClick={onClose}><X className="size-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>

        <div>
          <label className="text-xs text-muted-foreground">Enlaces (Strava, Garmin...)</label>
          {links.map((l, i) => (
            <div key={i} className="flex gap-2 mt-1">
              <input value={l} onChange={(e) => setLinks(links.map((x, j) => j === i ? e.target.value : x))}
                placeholder="https://..." className="flex-1 bg-input border border-border rounded px-2 py-1.5 text-sm" />
              <button onClick={() => setLinks(links.filter((_, j) => j !== i))}><X className="size-4" /></button>
            </div>
          ))}
          <button onClick={() => setLinks([...links, ""])} className="text-xs text-primary mt-1">+ Otro enlace</button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Capturas</label>
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="mt-1 w-full border-2 border-dashed border-border rounded-lg py-3 text-sm flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-60">
            <Upload className="size-4" /> {busy ? "Subiendo..." : "Subir imágenes"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          {previews.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {previews.map((p, i) => (
                <img key={i} src={p} className="h-20 rounded-lg border border-border" />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Field label="KM reales"><input type="number" step="0.1" value={km} onChange={(e) => setKm(+e.target.value)} className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm" /></Field>
          <Field label="Tiempo (min)"><input type="number" value={timeMin} onChange={(e) => setTimeMin(+e.target.value)} className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm" /></Field>
          <Field label={`RPE ${rpe}`}><input type="range" min="1" max="10" value={rpe} onChange={(e) => setRpe(+e.target.value)} className="w-full accent-primary" /></Field>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Notas</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-input border border-border rounded px-2 py-1.5 text-sm" />
        </div>

        <button onClick={save} disabled={busy}
          className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow disabled:opacity-60">
          Guardar reporte
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-[10px] text-muted-foreground">{label}</label>{children}</div>;
}

function ProfileTab({ a, isMine, onUpdate, onUploadCert }: {
  a: ReturnType<typeof useAthlete>["data"] & object;
  isMine: boolean;
  onUpdate: (p: Partial<{ full_name: string; dni: string; birth_date: string; objectives: string; certificate_date: string }>) => Promise<void>;
  onUploadCert: (file: File, date: string) => Promise<void>;
}) {
  const ar = activeRace(a);
  const [full, setFull] = useState(a.name.replace(/ \(Coach\)$/, ""));
  const [dni, setDni] = useState(a.dni);
  const [birth, setBirth] = useState(a.birthDate);
  const [obj, setObj] = useState(a.objectives);
  const [certDate, setCertDate] = useState(a.certificateDate);
  const [savedMsg, setSavedMsg] = useState("");

  const save = async () => {
    await onUpdate({ full_name: full, dni, birth_date: birth, objectives: obj, certificate_date: certDate });
    setSavedMsg("✓ Guardado"); setTimeout(() => setSavedMsg(""), 1500);
  };

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
        <div className="size-16 rounded-full bg-secondary flex items-center justify-center border-2 border-primary"><User className="size-7 text-primary" /></div>
        <div className="flex-1 min-w-0">
          <input value={full} onChange={(e) => setFull(e.target.value)} disabled={!isMine}
            className="w-full bg-transparent text-lg font-bold border-b border-border focus:border-primary outline-none disabled:opacity-70" />
          <p className="text-xs text-muted-foreground mt-1">{a.email}</p>
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-primary">Datos personales</h3>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">DNI</label>
          <input value={dni} onChange={(e) => setDni(e.target.value)} disabled={!isMine}
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-70" />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Fecha de nacimiento</label>
          <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} disabled={!isMine}
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-70" />
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <h3 className="text-xs uppercase tracking-widest text-primary">Certificado médico</h3>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Fecha de emisión</label>
          <input type="date" value={certDate} onChange={(e) => setCertDate(e.target.value)} disabled={!isMine}
            className="w-full mt-1 bg-input border border-border rounded-lg px-2 py-2 text-sm disabled:opacity-70" />
        </div>
        {isMine && (
          <label className="mt-1 w-full border-2 border-dashed border-border rounded-lg py-3 text-sm flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary cursor-pointer">
            <Upload className="size-4" /> Reemplazar foto del Certificado
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              await onUploadCert(f, certDate);
            }} />
          </label>
        )}
        {a.certificatePath && (
          <p className="text-xs text-success flex items-center gap-1"><FileText className="size-3" /> Certificado cargado</p>
        )}
      </section>

      <section className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-1"><Trophy className="size-3" /> Mis objetivos</h3>
        <textarea value={obj} onChange={(e) => setObj(e.target.value)} disabled={!isMine}
          rows={3} className="w-full bg-input border border-border rounded px-3 py-2 text-sm disabled:opacity-70" />
      </section>

      <section className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-xs uppercase tracking-widest text-primary mb-2">Mis marcas</h3>
        {a.races.length === 0 ? <p className="text-xs text-muted-foreground">El coach aún no registró marcas.</p> :
          <div className="space-y-2">
            {a.races.map((r) => (
              <div key={r.id} className={`flex items-center justify-between bg-secondary/60 rounded-lg p-2 text-sm ${r.id === ar?.id ? "border border-primary/50" : ""}`}>
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.date} · {r.distanceKm}km</p>
                </div>
                <p className="font-mono text-primary">{fmtTime(r.timeSec)}</p>
              </div>
            ))}
          </div>}
      </section>

      {isMine && (
        <button onClick={save} className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow">
          Guardar cambios {savedMsg && <span className="ml-2 text-xs">{savedMsg}</span>}
        </button>
      )}
    </div>
  );
}

function buildCalendar(cursor: Date) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const out: (null | { day: number; iso: string })[] = Array(offset).fill(null);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${(m+1).toString().padStart(2,"0")}-${d.toString().padStart(2,"0")}`;
    out.push({ day: d, iso });
  }
  return out;
}
