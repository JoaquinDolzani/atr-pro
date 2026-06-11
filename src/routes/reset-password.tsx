import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/atrt/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Restablecer contraseña · A Tu Ritmo" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Supabase places the recovery token in the URL hash; the SDK auto-handles it.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (pwd.length < 6) { setErr("Mínimo 6 caracteres."); return; }
    if (pwd !== pwd2) { setErr("Las contraseñas no coinciden."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwd });
      if (error) throw error;
      setMsg("Contraseña actualizada. Redirigiendo…");
      setTimeout(() => nav({ to: "/" }), 1200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex text-primary"><Logo size={48} /></div>
          <h1 className="text-xl font-bold">Nueva contraseña</h1>
        </div>
        {!ready ? (
          <p className="text-xs text-muted-foreground text-center">
            Abrí este enlace desde el correo de restablecimiento. Si ya estás logueado, también podés cambiar tu contraseña acá.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Nueva contraseña</label>
              <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} required minLength={6}
                className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Repetir</label>
              <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} required minLength={6}
                className="w-full mt-1 bg-input border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            {err && <div className="text-xs text-destructive">{err}</div>}
            {msg && <div className="text-xs text-success">{msg}</div>}
            <button disabled={busy} type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-xl glow disabled:opacity-60">
              {busy ? "..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
