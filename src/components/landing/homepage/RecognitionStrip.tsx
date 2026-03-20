const press = [
  "Agritech Innovation Lab",
  "Africa Climate Resilience Forum",
  "Kenya Cooperative Alliance",
  "Food Systems Partnership",
];

export function RecognitionStrip() {
  return (
    <section className="py-8">
      <div className="app-page-shell">
        <div className="agri-card flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-semibold text-foreground">Featured & supported by</p>
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
