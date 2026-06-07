import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCog, User as UserIcon } from "lucide-react";
import { Logo } from "../components/atrt/Logo";
import { CoachView } from "../components/atrt/CoachView";
import { AthleteView } from "../components/atrt/AthleteView";
import { useDB } from "../lib/atrt-store";

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
  const [db] = useDB();
  // role inicial desde URL (?role=coach&athleteId=...)
  const initial = (() => {
    if (typeof window === "undefined") return { role: "athlete" as "coach" | "athlete", athleteId: db.athletes[0]?.id };
    const p = new URLSearchParams(window.location.search);
    const role = (p.get("role") === "coach" ? "coach" : "athlete") as "coach" | "athlete";
    const athleteId = p.get("athleteId") || db.athletes[0]?.id;
    return { role, athleteId };
  })();

  const [role, setRole] = useState<"coach" | "athlete">(initial.role);
  const [athleteId] = useState<string>(initial.athleteId!);

  return (
    <div className="min-h-screen text-foreground">
      {/* Selector flotante DEV */}
      <div className="fixed top-3 right-3 z-40 bg-card/90 backdrop-blur border border-primary/40 rounded-full p-1 flex gap-1 shadow-lg">
        <button onClick={() => setRole("coach")}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${role === "coach" ? "bg-primary text-primary-foreground glow" : "text-muted-foreground"}`}>
          <UserCog className="size-3" /> Coach
        </button>
        <button onClick={() => setRole("athlete")}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${role === "athlete" ? "bg-primary text-primary-foreground glow" : "text-muted-foreground"}`}>
          <UserIcon className="size-3" /> Atleta
        </button>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-primary glow-text"><Logo size={32} /></span>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">A Tu Ritmo</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary/80 leading-tight">Running Team</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {role === "coach" ? <CoachView /> : <AthleteView athleteId={athleteId} />}
      </main>
    </div>
  );
}
