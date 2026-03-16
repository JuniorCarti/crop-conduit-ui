import { motion } from "framer-motion";
import { AlertTriangle, Globe2 } from "lucide-react";

const items = [
  {
    title: "Problem",
    description:
      "Farmers lack actionable intelligence, leading to crop losses and income instability.",
    icon: AlertTriangle,
  },
  {
    title: "Gap",
    description:
      "Existing weather apps fail to integrate localized climate alerts with AI-verified market pricing for low-bandwidth environments.",
    icon: Globe2,
  },
];

export function PurposeRationale() {
  return (
    <section id="purpose" className="py-12">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-section-label">Purpose & Rationale</p>
          <h2 className="agri-section-title">Why AgriSmart exists</h2>
          <p className="mt-4 text-muted-foreground">
            We translate climate intelligence into simple, trusted actions for smallholder communities.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.4 }}
                className="agri-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
