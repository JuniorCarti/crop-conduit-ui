const steps = [
  {
    title: "Climate planning",
    description: "Mary checks localized forecasts and selects the safest planting window.",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef",
  },
  {
    title: "Market timing",
    description: "She watches price signals to choose the best time and buyer to sell.",
    image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf",
  },
  {
    title: "Cooperative support",
    description: "Her cooperative uses AgriSmart insights to tailor guidance and training.",
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9",
  },
];

const metrics = [
  { value: "+18%", label: "Yield increase" },
  { value: "-22%", label: "Water waste" },
  { value: "3x", label: "Faster decisions" },
];

export function FarmerJourney() {
  return (
    <section className="py-12">
      <div className="app-page-shell space-y-8">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="agri-section-label">Farmer Impact Story</p>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Mary Mathuli · Kisumu, Kenya</p>
              <h2 className="agri-section-title mt-2">A day in the life with AgriSmart</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Climate uncertainty pushed Mary to switch from crop farming to poultry, which required less rainfall.
              After adopting AgriSmart, she returned to farming because she could clearly see when to plant, when to
              harvest, and where to sell using real-time climate and market intelligence.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                Climate-smart planting decisions
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                Real-time market pricing
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                Cooperative insights
              </li>
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-white/80 shadow-lg">
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full rounded-3xl"
                src="https://www.youtube.com/embed/j-OrYOLnPks"
                title="Farmer story Kenya"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-black/60 px-3 py-2 text-sm text-white">
              Real farmer story from Kenya
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="agri-card text-center">
              <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group h-full rounded-3xl border border-border/50 bg-white/80 p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="overflow-hidden rounded-3xl">
                <img
                  src={step.image}
                  alt={step.title}
                  className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Step {index + 1}</p>
                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="agri-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Join thousands of farmers making smarter decisions</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Partner with AgriSmart to scale data-driven farming and climate resilience.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/partnerships" className="agri-btn-primary">
              Become a Partner
            </a>
            <a href="#features" className="agri-btn-secondary">
              Explore Platform
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
