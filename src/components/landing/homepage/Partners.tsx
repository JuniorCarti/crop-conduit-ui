import { motion } from "framer-motion";

const partners = [
  {
    name: "Plogging Kenya",
    src: "https://ploggingkenya.org/wp-content/uploads/2020/04/plogging-logo-203x88.png",
  },
  {
    name: "AWS",
    src: "/images/aws.png",
  },
  {
    name: "Microsoft Azure",
    src: "https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png",
  },
  {
    name: "Google Cloud",
    src: "/images/google-cloud.png",
  },
  {
    name: "OpenAI",
    src:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAAAAABXZoBIAAABEElEQVR4AbTJIWyDQACG0d+rWsxENQ6Jwi0YFLIWRTKFxecc6pIzJzF4QTKDT23lSby5BPUt6ZJe2i1ze/aJP/x/+ly5/z2PU7ne1rIYm4/tR9YDsNeaFqP3l9wFx6AJgPLylLN6rrpEcBaiQko6dR/YDq4659po55SL8D1ujI0MLGpbl/K84nr8SWbSCBj5lNrvWewQCy1wU0gZsDV+ABi603nHtI9sJ0KW9d/paCxBjwy6wawyQiwdg2VPiZeBY5S10j3XjJRNoxWMqn20DB4tKeeWTUWhDfqJsX9rSRl0gLUQe20McpCSSwWAUxdBgaek0rQ6lQEwFS/JZ1cNebWFrVaElInLlNmv0TNpYgIAMy6KDbFgKo8AAAAASUVORK5CYII=",
  },
  {
    name: "Somo Africa",
    src: "https://www.somoafrica.org/images/logo/logo1.png",
  },
  {
    name: "Eldohub",
    src: "https://eldohub.co.ke/wp-content/uploads/2025/06/header_logo.png",
  },
  {
    name: "KCB",
    src: "/images/kcb.png",
  },
];

const carousel = [...partners, ...partners];

export function Partners() {
  return (
    <section id="partners" className="py-16 md:py-20">
      <div className="app-page-shell space-y-10">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Trusted by organizations advancing sustainable agriculture
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold text-foreground md:text-4xl">
            Our Partners & Technology Ecosystem
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
            AgriSmart collaborates with environmental organizations, technology leaders, and innovation hubs to build
            intelligent tools that support smallholder farmers and promote sustainable agriculture.
          </p>
        </div>

        <div className="agri-panel space-y-6">
          <div className="group relative overflow-hidden">
            <div className="flex w-max items-center gap-6 animate-partners-marquee group-hover:[animation-play-state:paused]">
              {carousel.map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex h-20 w-40 items-center justify-center rounded-2xl border border-white/30 bg-white/60 p-4 shadow-lg shadow-black/5 backdrop-blur-lg transition duration-300 hover:scale-105 hover:bg-white/70 hover:shadow-lg"
                >
                  <img
                    src={partner.src}
                    alt={`${partner.name} logo`}
                    className="max-h-10 w-auto transition duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {partners.map((partner) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.4 }}
                className="flex h-24 items-center justify-center rounded-2xl border border-white/30 bg-white/60 p-4 shadow-lg shadow-black/5 backdrop-blur-lg transition duration-300 hover:scale-105 hover:bg-white/70 hover:shadow-lg"
              >
                <img
                  src={partner.src}
                  alt={`${partner.name} logo`}
                  className="max-h-12 w-auto transition duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

