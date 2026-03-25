export function EidGreeting() {
  return (
    <section className="py-8">
      <div className="app-page-shell">
        <div className="agri-card flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
          <img
            src="/images/Eid%20Mubarak.png"
            alt="Eid Mubarak greeting"
            className="h-28 w-full max-w-sm rounded-2xl border border-border/50 object-cover shadow-sm md:h-24 md:w-48"
            loading="lazy"
            decoding="async"
          />
          <div className="space-y-2">
            <p className="agri-section-label">Eid Mubarak</p>
            <h2 className="text-xl font-semibold text-foreground">Happy Eid Mubarak from AgriSmart</h2>
            <p className="text-sm text-muted-foreground">
              Wishing our farmers, partners, and communities peace, prosperity, and a joyful Eid celebration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

