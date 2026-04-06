import { motion } from "framer-motion";

const cards = [
  {
    title: "Partner With AgriSmart",
    description:
      "We collaborate with farmer cooperatives, NGOs, research institutions, and agribusiness organizations to pilot and scale data-driven farming solutions.",
    cta: "Become a Partner",
    href: "/partnerships",
    image:
      "https://plus.unsplash.com/premium_photo-1661329844154-a18092819637?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fHBhcnRuZXJzaGlwfGVufDB8fDB8fHww",
  },
  {
    title: "Internship Opportunities",
    description:
      "Students and young professionals can gain hands-on experience working on agritech innovation, digital platforms, and farmer-focused technology solutions.",
    cta: "Apply for Internship",
    href: "#internships",
    image:
      "https://images.pexels.com/photos/3184396/pexels-photo-3184396.jpeg",
  },
  {
    title: "Volunteer With AgriSmart",
    description:
      "Join our mission-driven community supporting the AgriSmart pilot. Volunteers contribute their expertise in operations, partnerships, data analysis, and field coordination.",
    cta: "Apply to Volunteer",
    href: "#volunteer-form",
    image:
      "https://images.pexels.com/photos/6591147/pexels-photo-6591147.jpeg",
  },
];

export function WorkWithUs() {
  return (
    <section id="work-with-us" className="py-16 md:py-20">
      <div className="app-page-shell space-y-8">
        <div className="agri-panel-muted space-y-8">
          <div className="max-w-3xl">
            <p className="agri-kicker">Work With Us</p>
            <h2 className="agri-display mt-4">Work With Us to Transform African Agriculture</h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
            AgriSmart is building tools that empower farmers with climate intelligence, market insights, and data-driven
            decision making. We collaborate with partners, volunteers, and young innovators who want to create meaningful
            impact in agriculture.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.03 }}
              viewport={{ once: true, amount: 0.3 }}
              className="agri-card group flex h-full flex-col gap-3 bg-white/60 transition hover:-translate-y-1 hover:bg-white/70 hover:shadow-lg"
            >
              <div className="overflow-hidden rounded-2xl bg-muted">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-44 w-full object-cover transition duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">{card.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
              </div>
              <a href={card.href} className="agri-btn-primary mt-auto w-full justify-center">
                {card.cta}
              </a>
            </motion.div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}

