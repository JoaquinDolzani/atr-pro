import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/atrt/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Ingresar · A Tu Ritmo" }] }),
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    if ((search as { suspended?: string } | undefined)?.suspended) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  validateSearch: (s: Record<string, unknown>) => ({
    suspended: typeof s.suspended === "string" ? s.suspended : undefined,
  }),
  component: AuthPage,
});

const SUSPENDED_MSG = "Tu cuenta se encuentra suspendida. Por favor, comunícate con tu entrenador Joaquín Dolzani para reactivarla.";

function AuthPage() {
  const nav = useNavigate();
  const { suspended } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (suspended) setErr(SUSPENDED_MSG);
  }, [suspended]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
        // Check suspension
        const { data: prof } = await supabase.from("profiles").select("is_active").eq("id", data.user!.id).maybeSingle();
        if (prof && prof.is_active === false) {
          await supabase.auth.signOut();
          setErr(SUSPENDED_MSG);
          setBusy(false);
          return;
        }
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
          {err && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/40 rounded-lg p-2 leading-snug">
              {err}
            </div>
          )}
          <button disabled={busy} type="submit"
            className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow disabled:opacity-60">
            {busy ? "..." : mode === "signin" ? "Entrar" : "Crear cuenta"}
          </button>
          {mode === "signin" && (
            <button type="button" onClick={async () => {
              setErr(null);
              if (!email) { setErr("Ingresá tu email arriba primero."); return; }
              setBusy(true);
              try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setErr("Te enviamos un correo con el enlace para restablecer la contraseña.");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Error");
              } finally { setBusy(false); }
            }}
              className="block w-full text-center text-xs text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        <p className="text-[11px] text-muted-foreground text-center">
          Los nuevos usuarios entran como atletas. Solo el coach autorizado tiene acceso al panel.
        </p>
      </div>
    </div>
  );
}

