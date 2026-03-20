export function ExplainerMedia() {
  return (
    <section className="py-12">
      <div className="app-page-shell grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="agri-section-label">How AgriSmart Works</p>
          <h2 className="agri-section-title">A 120-second overview of our workflow</h2>
          <p className="mt-3 text-sm text-muted-foreground">
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
        <div className="agri-card overflow-hidden">
          <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black/10">
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/nD98axN9BgA"
              title="AgriSmart platform overview"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
