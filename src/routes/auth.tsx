import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/atrt/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Ingresar · A Tu Ritmo" }] }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
      }
      nav({ to: "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex text-primary"><Logo size={48} /></div>
          <h1 className="text-xl font-bold">A Tu Ritmo</h1>
          <p className="text-xs uppercase tracking-widest text-primary/80">Running Team</p>
        </div>

        <div className="flex gap-1 bg-secondary/50 rounded-full p-1">
          {(["signin","signup"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded-full text-sm transition ${mode === m ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}`}>
              {m === "signin" ? "Iniciar sesión" : "Registrarme"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="text-xs text-muted-foreground">Nombre completo</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Contraseña</label>
            <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button disabled={busy} type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow disabled:opacity-60">
            {busy ? "..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center">
          Los nuevos usuarios entran como atletas. Solo el coach autorizado tiene acceso al panel.
        </p>
      </div>
    </div>
  );
}
