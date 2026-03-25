import { ArrowRight, ShieldCheck, Lock, Database, Globe, BookOpenText, Sparkles } from "lucide-react";

const stats = [
  { label: "Farmers in Pilot", value: "5,000" },
  { label: "Pilot Regions", value: "3" },
  { label: "Target Yield Lift", value: "15%" },
  { label: "Post-Harvest Losses", value: "-20%" },
];

export function ImpactSnapshot() {
  return (
    <section className="py-16 md:py-20">
      <div className="app-page-shell">
        <div className="rounded-[36px] border border-white/70 bg-white/70 px-6 py-10 shadow-card backdrop-blur md:px-10">
          <div className="text-center">
            <p className="agri-section-label">Impact Snapshot</p>
            <h2 className="agri-section-title">Pilot Targets at a Glance</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
              Early targets for our first pilot phase. We will update with verified impact data as pilots conclude.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-primary/10 bg-gradient-to-br from-white/90 to-emerald-50/70 px-6 py-6 text-center shadow-sm"
              >
                <p className="text-4xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

