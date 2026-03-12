import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "AgriSmart helped us cut irrigation waste by 22% and align planting with better pricing windows.",
    name: "Lydia M.",
    role: "Operations Lead, Makueni Farms",
  },
  {
    quote:
      "We finally have climate, crop, and market signals in one dashboard. Decisions are faster and calmer.",
    name: "Samuel K.",
    role: "Director, Rift Valley Co-op",
  },
  {
    quote:
      "The trading workflow is secure and predictable. Our buyers trust the visibility we share.",
    name: "Nora A.",
    role: "Supply Chain Manager, EastHarvest",
  },
];

export function Testimonials() {
  return (
    <section id="about" className="py-20">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-section-label">Testimonials</p>
          <h2 className="agri-section-title">Trusted by progressive farming teams</h2>
          <p className="mt-4 text-muted-foreground">
            Hear from farmers and agribusiness leaders using AgriSmart every day.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: "22%", label: "Irrigation waste reduced" },
            { value: "18%", label: "Yield lift on pilot farms" },
            { value: "3x", label: "Faster pricing decisions" },
          ].map((stat) => (
            <div key={stat.label} className="agri-card text-center">
              <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.4 }}
              className="agri-card"
            >
              <p className="text-sm text-muted-foreground">"{item.quote}"</p>
              <div className="mt-6 border-t border-emerald-100/60 pt-4">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
