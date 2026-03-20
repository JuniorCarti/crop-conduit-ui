import { useEffect, useState } from "react";
import { HeartHandshake, Cpu, Users, Landmark, ChevronLeft, ChevronRight } from "lucide-react";

const donationSlides = [
  {
    title: "Support Pilot Deployment",
    description: "Help fund farmer onboarding and pilot activities.",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    icon: HeartHandshake,
  },
  {
    title: "Support Technology Development",
    description: "Contribute to building and improving the AgriSmart platform.",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    icon: Cpu,
  },
  {
    title: "Support Community Outreach",
    description: "Help us train and engage farmer cooperatives and local communities.",
    image:
      "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0",
    icon: Users,
  },
];

const transparencyItems = [
  "Farmer onboarding and training",
  "Platform development and maintenance",
  "Data access (weather & market insights)",
  "Pilot program execution",
];

export function Donate() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = donationSlides.length;

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, total]);

  const activeSlide = donationSlides[activeIndex];

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  return (
    <section id="donate" className="py-12">
      <div className="app-page-shell space-y-8">
        <div className="max-w-3xl">
          <p className="agri-section-label">Support AgriSmart</p>
          <h2 className="agri-section-title">Support AgriSmart</h2>
          <p className="mt-3 text-muted-foreground">
            Your contribution helps us empower farmers with climate intelligence, market access, and data-driven tools.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            AgriSmart is building solutions to improve agricultural decision-making for smallholder farmers. Your support
            helps us pilot our platform, work with farmer cooperatives, and expand access to data-driven tools across
            communities.
          </p>
        </div>

        <div
          className="agri-card relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative h-64 w-full overflow-hidden rounded-3xl sm:h-72 lg:h-80">
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className="h-full w-full object-cover transition duration-700"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/10" />
            <div className="absolute inset-0 flex flex-col justify-end gap-2 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">Donation Focus</p>
              <h3 className="text-2xl font-semibold sm:text-3xl">{activeSlide.title}</h3>
              <p className="max-w-xl text-sm text-white/80 sm:text-base">{activeSlide.description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://paystack.com/pay/agrismart-donate"
                  target="_blank"
                  rel="noreferrer"
                  className="agri-btn-primary"
                >
                  Donate Now
                </a>
                <a href="#mpesa" className="agri-btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Donate via M-Pesa
                </a>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
            <button
              type="button"
              onClick={goPrev}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
            {donationSlides.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === activeIndex ? "bg-white" : "bg-white/40"
                }`}
                aria-label={`Go to ${slide.title}`}
              />
            ))}
          </div>
        </div>

        <div id="mpesa" className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="agri-card relative overflow-hidden text-white">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url(/images/kcb.png)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/30" />
            <div className="relative space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Donate via M-Pesa</h3>
                <p className="mt-2 text-sm text-white/80">
                  Use M-Pesa to support AgriSmart directly with the official paybill details below.
                </p>
                <div className="mt-4 grid gap-2 text-sm text-white">
                  <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-2">
                    <span className="text-white/70">Paybill</span>
                    <span className="font-semibold">522522</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-2">
                    <span className="text-white/70">Account Number</span>
                    <span className="font-semibold">1325670235</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="agri-card space-y-3">
            <h3 className="text-base font-semibold text-foreground">How Your Support Helps</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {transparencyItems.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
