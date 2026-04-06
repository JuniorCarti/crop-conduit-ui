import { motion } from "framer-motion";

const goals = [
  {
    title: "Smarter Planting Decisions",
    description:
      "Help farmers choose the right planting time using localized climate forecasts and seasonal signals.",
    image:
      "https://plus.unsplash.com/premium_photo-1663040294799-04609cd9e92b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fGZhcm1lcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    title: "Better Market Timing",
    description:
      "Provide real-time market price data so farmers can decide when and where to sell their produce.",
    image:
      "https://plus.unsplash.com/premium_photo-1661409151761-31d12ede6870?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTh8fGZhcm1lcnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    title: "Reduced Post-Harvest Losses",
    description:
      "Enable farmers to align production with real demand and connect directly with buyers.",
    image:
      "https://images.unsplash.com/photo-1707721690626-10e5f0366bcb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8ZmFybWVyJTIwd29tZW58ZW58MHx8MHx8fDA%3D",
  },
];

export function Testimonials() {
  return (
    <section id="about" className="py-16 md:py-20">
      <div className="app-page-shell space-y-10">
        <div className="agri-panel space-y-8">
          <div className="max-w-2xl">
            <p className="agri-kicker">Pilot Impact Goals</p>
            <h2 className="agri-display mt-4">Pilot Impact Goals</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
            AgriSmart is preparing for its first pilot deployment with farmer cooperatives. These are the outcomes we aim
            to achieve through real-time climate insights and market intelligence.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.4 }}
              className="agri-card group bg-white/60 hover:-translate-y-1 hover:bg-white/70 hover:shadow-lg"
            >
              <div className="overflow-hidden rounded-2xl">
                <img
                  src={goal.image}
                  alt={goal.title}
                  loading="lazy"
                  decoding="async"
                  className="h-44 w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{goal.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
            </motion.div>
          ))}
          </div>
          <div className="rounded-3xl border border-primary/20 bg-white/60 p-5 text-center backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-foreground">Pilot Deployment in Progress</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Pilot Deployment in Progress. Real farmer stories and impact results will be shared here once the pilot
              phase is completed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

