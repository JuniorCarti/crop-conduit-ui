import { motion } from "framer-motion";

const team = [
  {
    name: "Ridge Junior Abuto",
    role: "Founder & Team Lead",
    bio: "Leads AgriSmart with vision and strategy, connecting technology with smallholder farmers.",
    image: "/images/ridge-junior-abuto.jpg",
  },
  {
    name: "Vanessa Audrey",
    role: "Impact & Story Lead",
    bio: "Crafts compelling stories of AgriSmart's impact and ensures community engagement.",
    image:
      "https://plus.unsplash.com/premium_photo-1683140621573-233422bfc7f1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8cHJvZmlsZSUyMGltYWdlc3xlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Caleb Mwendwa",
    role: "Socials & Marketing",
    bio: "Drives social media and marketing campaigns to showcase AgriSmart's mission and results.",
    image:
      "https://plus.unsplash.com/premium_photo-1689539137236-b68e436248de?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fHByb2ZpbGUlMjBpbWFnZXN8ZW58MHx8MHx8fDA%3D",
  },
  {
    name: "Allan Onyonka",
    role: "Machine Learning Specialist",
    bio: "Designs AI models to deliver real-time climate and market intelligence to farmers.",
    image:
      "https://plus.unsplash.com/premium_photo-1661317435794-2a4fee04e42b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA5fHxwcm9maWxlJTIwaW1hZ2VzfGVufDB8fDB8fHww",
  },
  {
    name: "Jackline Kibiwot",
    role: "Research & Farmer Liaison",
    bio: "Connects directly with farmers, gathering insights and ensuring AgriSmart solutions are actionable.",
    image:
      "https://plus.unsplash.com/premium_photo-1669800502105-c181897af983?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzN8fHByb2ZpbGUlMjBpbWFnZXN8ZW58MHx8MHx8fDA%3D",
  },
];

export function Team() {
  return (
    <section id="team" className="py-16 md:py-20">
      <div className="app-page-shell space-y-10">
        <div className="max-w-2xl">
          <p className="agri-kicker">Team</p>
          <h2 className="agri-display mt-4">The people behind AgriSmart</h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            A multidisciplinary team committed to building resilient farming systems.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.4 }}
              className="agri-card transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


