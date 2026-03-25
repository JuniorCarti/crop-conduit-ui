import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section id="pricing" className="py-16 md:py-20">
      <div className="app-page-shell">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="relative overflow-hidden rounded-[36px] border border-emerald-900/40 bg-gradient-to-br from-[#0b6b3a] via-[#0b6b3a] to-[#0f5131] px-8 py-10 shadow-glow md:px-12 md:py-12"
        >
          <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-[90px]" />
          <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-lime-200/10 blur-[120px]" />

          <div className="relative grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="agri-kicker text-white/80">Get Started</p>
              <h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold text-white sm:text-4xl md:text-5xl">
                Start managing your farm intelligently today
              </h2>
              <p className="mt-4 max-w-xl text-sm text-white/85 md:text-base">
                Create your free account and start monitoring climate, crop performance, and market signals in one place.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 md:items-end">
              <Link
                to="/signup"
                className="agri-btn-primary px-8 py-3 text-white shadow-xl ring-2 ring-white/30"
              >
                Get Started
              </Link>
              <p className="text-xs text-white/70">Free to start. No credit card required.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

