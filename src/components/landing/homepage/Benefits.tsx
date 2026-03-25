import { motion } from "framer-motion";
import { BadgeCheck, CloudRain, Leaf, LineChart, Truck, Workflow } from "lucide-react";

const benefits = [
  { label: "AI crop forecasting", icon: Leaf },
  { label: "Real-time weather insights", icon: CloudRain },
  { label: "Farm productivity analytics", icon: LineChart },
  { label: "Supply chain tracking", icon: Truck },
  { label: "Market intelligence", icon: BadgeCheck },
  { label: "Smart harvest planning", icon: Workflow },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-16 md:py-20">
      <div className="app-page-shell">
        <div className="agri-panel space-y-10">
          <div className="max-w-2xl">
            <p className="agri-kicker">Platform Benefits</p>
            <h2 className="agri-display mt-4">Purpose-built for farmers and agribusiness teams</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Build resilient operations with data you can trust and tools that adapt to your region.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.04 }}
                viewport={{ once: true, amount: 0.4 }}
                className="agri-card flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-100 to-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200/60 sm:h-11 sm:w-11">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{benefit.label}</p>
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </section>
  );
}

