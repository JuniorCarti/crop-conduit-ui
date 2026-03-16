import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function CTA() {
  return (
    <section id="pricing" className="py-12">
      <div className="app-page-shell">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="agri-cta"
        >
          <div>
            <p className="agri-section-label text-white/80">Get Started</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold md:text-4xl">
              Start managing your farm intelligently today
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-white/80">
              Create your free account and start monitoring climate, crop performance, and market signals in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/signup" className="agri-btn-primary bg-white text-primary hover:bg-white/90">
              Get Started
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
