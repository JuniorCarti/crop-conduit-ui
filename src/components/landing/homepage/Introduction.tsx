import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function Introduction() {
  return (
    <section id="introduction" className="py-12">
      <div className="app-page-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="agri-card"
          >
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
            className="relative h-full overflow-hidden rounded-3xl shadow-card"
          >
            <div className="relative">
              <img
                src="/images/africa.jpg"
                alt="African smallholder farmer holding crops"
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
