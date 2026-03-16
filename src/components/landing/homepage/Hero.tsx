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
      style={{ backgroundImage: "url('/home_page.jpg')" }}
    >
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        poster="/images/africa.jpg"
        id="bg-video"
        aria-hidden="true"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
        <source src="/videos/background.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative app-page-shell flex min-h-screen items-center justify-center py-24 text-center">
        <motion.div {...fadeUp} className="max-w-3xl">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
            Farm Intelligence Platform
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-tight md:text-6xl lg:text-7xl">
            The Premium Command Center for Modern Agriculture
          </h1>
          <h2 className="mx-auto mt-5 max-w-2xl text-base font-normal text-white/80 md:text-lg">
            Climate & Market Intelligence for Resilient Smallholder Farming
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup" className="agri-btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="agri-btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20">
              Sign In
            </Link>
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
