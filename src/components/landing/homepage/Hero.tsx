import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
  viewport: { once: true, amount: 0.4 },
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center justify-center overflow-hidden text-white"
      style={{ backgroundImage: "url('/images/africa.jpg')" }}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/images/africa.jpg"
        id="bg-video"
        aria-hidden="true"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        <source src="/videos/background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/70" />
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-lime-300/15 blur-[140px]" />

      <div className="relative app-page-shell flex min-h-screen items-center justify-center py-28 text-center md:py-32">
        <motion.div {...fadeUp} className="mx-auto max-w-4xl rounded-3xl border border-white/30 bg-white/20 px-6 py-10 backdrop-blur-xl md:px-8 md:py-12">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            Farm Intelligence Platform
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            Built for farmers <span className="mx-2 text-white/60">{"\u2022"}</span> NGOs{" "}
            <span className="mx-2 text-white/60">{"\u2022"}</span> Cooperatives
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold uppercase leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            The Premium Command Center for{" "}
            <span className="agri-animated-highlight">
              Modern Agriculture
            </span>
          </h1>
          <h2 className="mx-auto mt-6 max-w-2xl text-base font-normal text-white/85 sm:text-lg md:text-xl">
            Climate & Market Intelligence for Resilient Smallholder Farming
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/signup" className="agri-btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="agri-btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
              Sign In
            </Link>
          </div>
          <div className="mt-6 flex justify-center">
            <a
              href="#explainer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 transition hover:text-white"
            >
              Watch Demo
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                {"\u25B6"}
              </span>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-white/70">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">AI crop forecasting</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Real-time climate intelligence</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">Secure commodity trading</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


