import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const objectives = [
  "Onboard 5,000 farmers across 3 pilot regions in first 6 months",
  "Reduce climate-related crop losses by 20%",
  "Increase average profit margins by 15%",
];

export function ProjectDescription() {
  return (
    <section id="project" className="py-20">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-section-label">Project Description</p>
          <h2 className="agri-section-title">Turning complex data into simple action</h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="agri-card"
        >
          <p className="text-muted-foreground">
            Transforms complex data into simple SMS and app-based advisories to strengthen smallholder resilience and
            income stability.
          </p>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">
          {objectives.map((objective, index) => (
            <motion.div
              key={objective}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.4 }}
              className="agri-card transition hover:-translate-y-1"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-foreground">{objective}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
