const press = [
  "Agritech Innovation Lab",
  "Africa Climate Resilience Forum",
  "Kenya Cooperative Alliance",
  "Food Systems Partnership",
];

export function RecognitionStrip() {
  return (
    <section className="py-10">
      <div className="app-page-shell">
        <div className="agri-card flex flex-wrap items-center justify-between gap-4 bg-white/60 hover:bg-white/70">
          <p className="text-sm font-semibold text-foreground">
            Trusted by <span className="agri-animated-highlight">farmers</span>, cooperatives, NGOs, and agribusiness teams
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {press.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

