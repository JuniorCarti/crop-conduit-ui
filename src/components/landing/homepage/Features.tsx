import { motion } from "framer-motion";
import { CloudSun, LineChart, ShieldCheck, Sprout } from "lucide-react";

const features = [
  {
    title: "Climate & Crop Intelligence",
    description: "AI-powered climate insights and predictive crop health signals.",
    icon: CloudSun,
  },
  {
    title: "Smart Farm Monitoring",
    description: "Track performance, irrigation, and yield readiness in real time.",
    icon: Sprout,
  },
  {
    title: "Market Price Intelligence",
    description: "Live market prices, buyer demand, and trading signals in one feed.",
    icon: LineChart,
  },
  {
    title: "Secure Agricultural Trading",
    description: "Digitize contracts, track delivery, and trade with full confidence.",
    icon: ShieldCheck,
  },
];

export function Features() {
  return (
    <section id="features" className="py-12">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-section-label">Platform Features</p>
          <h2 className="agri-section-title">
            Every signal your farm needs, unified in one dashboard
          </h2>
          <p className="mt-4 text-muted-foreground">
            AgriSmart blends climate intelligence, crop performance, and market data into a single, cinematic workflow.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
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
                    <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
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
