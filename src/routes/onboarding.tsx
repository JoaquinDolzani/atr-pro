import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, Save } from "lucide-react";
import { Logo } from "@/components/atrt/Logo";
import { useAuth, uploadCertificate } from "@/lib/atrt-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Completá tu perfil · A Tu Ritmo" }] }),
  component: Onboarding,
});

function Onboarding() {
  const auth = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [birth, setBirth] = useState("");
  const [certDate, setCertDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!auth.loading && !auth.userId) {
    if (typeof window !== "undefined") window.location.replace("/auth");
    return null;
  }
  if (!auth.loading && auth.profile?.onboardingComplete) {
    if (typeof window !== "undefined") window.location.replace("/");
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setErr("Subí la foto de tu certificado médico."); return; }
    setBusy(true); setErr(null);
    try {
      const path = await uploadCertificate(auth.userId!, file);
      const { error } = await supabase.from("profiles").update({
        full_name: name, dni, birth_date: birth,
        certificate_date: certDate, certificate_path: path,
        onboarding_complete: true,
      }).eq("id", auth.userId!);
      if (error) throw error;
      nav({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error guardando");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex text-primary"><Logo size={40} /></div>
          <h1 className="text-lg font-bold">Completá tu perfil</h1>
          <p className="text-xs text-muted-foreground">Necesitamos estos datos antes de empezar.</p>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Nombre completo *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">DNI *</label>
            <input value={dni} onChange={(e) => setDni(e.target.value)} required placeholder="00.000.000"
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Nacimiento *</label>
            <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} required
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Fecha del certificado médico *</label>
          <input type="date" value={certDate} onChange={(e) => setCertDate(e.target.value)} required
            className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Foto del certificado médico *</label>
          <label className="mt-1 w-full border-2 border-dashed border-border rounded-lg py-4 text-sm flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary cursor-pointer">
            <Upload className="size-4" /> {file ? file.name : "Subir foto / imagen"}
            <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        {err && <p className="text-xs text-destructive">{err}</p>}
        <button disabled={busy} type="submit"
          className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow flex items-center justify-center gap-2 disabled:opacity-60">
          <Save className="size-4" /> {busy ? "Guardando..." : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}
