import { ArrowRight, ShieldCheck, Lock, Database, Globe, BookOpenText, Sparkles } from "lucide-react";

const stats = [
  { label: "Farmers in Pilot", value: "5,000" },
  { label: "Pilot Regions", value: "3" },
  { label: "Target Yield Lift", value: "15%" },
  { label: "Post-Harvest Losses", value: "-20%" },
];

export function ImpactSnapshot() {
  return (
    <section className="py-12">
      <div className="app-page-shell">
        <div className="agri-card flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="agri-section-label">Impact Snapshot</p>
            <h2 className="agri-section-title">Pilot Targets at a Glance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Early targets for our first pilot phase. We will update with verified impact data as pilots conclude.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-primary/10 bg-white/70 px-4 py-3 text-center">
                <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
