import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserCog, User as UserIcon, LogOut } from "lucide-react";
import { Logo } from "@/components/atrt/Logo";
import { CoachView } from "@/components/atrt/CoachView";
import { AthleteView } from "@/components/atrt/AthleteView";
import { useAuth } from "@/lib/atrt-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Tu Ritmo Running Team" },
      { name: "description", content: "Plataforma de gestión y entrenamiento del running team A Tu Ritmo." },
    ],
  }),
  component: Index,
});

function Index() {
  const auth = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<"coach" | "athlete">("athlete");

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.userId) { nav({ to: "/auth" }); return; }
    // Suspension check (real-time when profile refetches)
    if (auth.profile && auth.profile.isActive === false && !auth.isCoach) {
      supabase.auth.signOut().then(() => nav({ to: "/auth", search: { suspended: "1" } }));
      return;
    }
    if (auth.profile && !auth.profile.onboardingComplete) { nav({ to: "/onboarding" }); return; }
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const r = p.get("role");
      if (auth.isCoach && r === "athlete") setRole("athlete");
      else if (auth.isCoach) setRole("coach");
      else setRole("athlete");
    }
  }, [auth.loading, auth.userId, auth.profile?.onboardingComplete, auth.profile?.isActive, auth.isCoach, nav]);

  if (auth.loading || !auth.userId || !auth.profile?.onboardingComplete) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Cargando...</div>;
  }

  const athleteId = (() => {
    if (!auth.isCoach) return auth.userId;
    if (typeof window === "undefined") return auth.userId;
    const p = new URLSearchParams(window.location.search);
    return p.get("athleteId") || auth.userId;
  })();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className="min-h-screen text-foreground">
      {/* Selector solo para coach */}
      {auth.isCoach && (
        <div className="fixed top-3 right-3 z-40 bg-card/90 backdrop-blur border border-primary/40 rounded-full p-1 flex gap-1 shadow-lg">
          <button onClick={() => setRole("coach")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${role === "coach" ? "bg-primary text-primary-foreground glow" : "text-muted-foreground"}`}>
            <UserCog className="size-3" /> Entrenador
          </button>
          <button onClick={() => setRole("athlete")}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${role === "athlete" ? "bg-primary text-primary-foreground glow" : "text-muted-foreground"}`}>
            <UserIcon className="size-3" /> Atleta
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-primary glow-text"><Logo size={32} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm leading-tight truncate">A Tu Ritmo</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary/80 leading-tight">Running Team</p>
          </div>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-1" title="Cerrar sesión">
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pt-12">
        {auth.isCoach && role === "coach" ? <CoachView /> : <AthleteView athleteId={athleteId!} />}
      </main>
    </div>
  );
}
