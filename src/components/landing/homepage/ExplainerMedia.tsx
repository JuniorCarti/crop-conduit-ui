export function ExplainerMedia() {
  return (
    <section id="explainer" className="py-16 md:py-20">
      <div className="app-page-shell">
        <div className="agri-panel-muted grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="agri-kicker">How AgriSmart Works</p>
            <h2 className="agri-display mt-4">A 120-second overview of our workflow</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              See how climate signals, market intelligence, and farmer guidance come together inside AgriSmart.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Climate forecasts translated into planting windows.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Market prices and buyer signals updated daily.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              Advisors and cooperatives monitor group progress in real time.
            </li>
          </ul>
        </div>
        <div className="agri-card group overflow-hidden bg-white/80">
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black/10">
            <iframe
              className="h-full w-full transition duration-700 group-hover:scale-[1.02]"
              src="https://www.youtube.com/embed/nD98axN9BgA"
              title="AgriSmart platform overview"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-lg backdrop-blur">
                {"\u25B6"}
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 border border-white/30" />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}


