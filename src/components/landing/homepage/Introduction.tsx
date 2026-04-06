import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function Introduction() {
  return (
    <section id="introduction" className="py-16 md:py-20">
      <div className="app-page-shell">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="agri-card relative overflow-hidden bg-white/60 hover:bg-white/70"
          >
            <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-emerald-200/30 blur-3xl" />
            <p className="agri-section-label">Introduction</p>
            <h2 className="agri-section-title">Designed for the backbone of African food systems</h2>
            <p className="mt-4 text-muted-foreground">
              Smallholder farmers are the backbone of African food systems, yet they face increasing climate uncertainty.
              AgriSmart bridges the gap between high-level climate data and on-the-ground action, partnering with Farmer
              Cooperatives, SACCOs, and NGOs to ensure innovation reaches those who need it most.
            </p>
            <div className="mt-6">
              <Link to="/signup" className="agri-btn-primary">
                Get Started
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
            viewport={{ once: true, amount: 0.4 }}
            className="group relative h-full overflow-hidden rounded-3xl"
          >
            {/* Main image container */}
            <div className="relative h-full">
              <img
                src="/images/africa.jpg"
                alt="African smallholder farmer holding crops"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />

              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

              {/* Floating glass elements */}
              <div className="pointer-events-none absolute top-8 right-8">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-lg" />
              </div>

              <div className="pointer-events-none absolute bottom-12 left-8">
                <div className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-lg border border-white/20 shadow-md" />
              </div>

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                    viewport={{ once: true, amount: 0.4 }}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-xl shadow-black/10 max-w-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-white" />
                      </div>
                      <div>
                        <div className="h-2 bg-gray-300 rounded-full w-20" />
                        <div className="h-1.5 bg-gray-200 rounded-full w-16 mt-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded-full w-full" />
                      <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                      <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Decorative corner elements */}
              <div className="pointer-events-none absolute top-4 left-4">
                <div className="flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-white/60" />
                  <div className="h-2 w-8 rounded-full bg-white/40" />
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-4 right-4">
                <div className="flex flex-col gap-2 items-end">
                  <div className="h-2 w-2 rounded-full bg-white/60" />
                  <div className="h-2 w-6 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

