import { motion } from "framer-motion";

const steps = [
  {
    title: "Create your AgriSmart account.",
    detail: "Launch a secure workspace for your farm or agribusiness team.",
  },
  {
    title: "Connect your farm data.",
    detail: "Sync climate feeds, crop logs, and market sources in minutes.",
  },
  {
    title: "Monitor crops and trade confidently.",
    detail: "Make every decision with live intelligence and AI forecasts.",
  },
];

export function HowItWorks() {
  return (
    <section id="solutions" className="relative py-16 md:py-20">
      <div className="app-page-shell">
        <div className="agri-panel grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="agri-kicker">How It Works</p>
            <h2 className="agri-display mt-4">
              From insight to harvest-ready decisions
            </h2>
            <p className="mt-4 text-sm text-muted-foreground md:text-base">
              AgriSmart connects every signal from field sensors to market demand so your team can act faster.
            </p>
          </div>
          <div className="relative space-y-6">
            <span
              className="pointer-events-none absolute left-6 top-4 hidden h-[calc(100%-2rem)] w-px bg-emerald-100 md:block"
              aria-hidden="true"
            />
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.4 }}
                className="agri-card hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start gap-5">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-base font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200/60 sm:h-12 sm:w-12">
                    0{index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

