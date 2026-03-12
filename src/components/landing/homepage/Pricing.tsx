import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Farmer Access",
    price: "Free Forever",
    badge: "Farmer First",
    description: "Designed for individual smallholder farmers.",
    features: [
      "AI crop insights",
      "Weather and climate alerts",
      "Basic farming recommendations",
      "Crop disease guidance",
      "Mobile friendly dashboard",
    ],
    cta: "Get Started Free",
    href: "/signup",
  },
  {
    name: "Cooperative Plan",
    price: "KSh 30,000 / month",
    yearly: "KSh 288,000 / year",
    savings: "Save KSh 72,000 with yearly billing",
    trial: "60-day free trial",
    highlight: true,
    description: "Built for cooperatives and member-based farmer organizations.",
    features: [
      "Manage multiple farms and farmers",
      "Cooperative analytics dashboard",
      "AI crop recommendations for members",
      "Weather and soil insights",
      "Market price alerts",
      "Member productivity tracking",
    ],
    cta: "Start 60-Day Free Trial",
    href: "/signup",
  },
  {
    name: "Government / NGO Plan",
    price: "KSh 100,000 / month",
    yearly: "KSh 900,000 / year",
    savings: "Save KSh 300,000 with yearly billing",
    badge: "Institutional Plan",
    description: "For large-scale agricultural programs and public sector initiatives.",
    features: [
      "Large scale farmer program management",
      "County or national dashboards",
      "Impact monitoring and reporting",
      "AI analytics for agricultural programs",
      "API integrations for government systems",
      "Dedicated technical support",
    ],
    cta: "Contact Sales",
    href: "#contact",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <div className="app-page-shell space-y-10">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Accessible Technology for Every Farmer
          </div>
          <h2 className="mt-6 font-heading text-3xl font-semibold text-foreground md:text-4xl">
            Pricing That Supports Farmers First
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
            Farmers access AgriSmart for free. Cooperatives, NGOs, and government programs fund the platform to enable
            scalable agricultural intelligence and impact.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.05 }}
              viewport={{ once: true, amount: 0.4 }}
              className={`agri-card flex h-full flex-col gap-6 transition hover:-translate-y-1 hover:shadow-lg ${
                plan.highlight ? "border-primary/40 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{plan.price}</p>
                  {plan.yearly ? (
                    <p className="mt-1 text-sm text-muted-foreground">{plan.yearly}</p>
                  ) : null}
                </div>
                {plan.highlight ? (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                ) : null}
                {plan.badge ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {plan.badge}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              {plan.trial ? (
                <p className="text-sm font-semibold text-emerald-700">{plan.trial}</p>
              ) : null}
              {plan.savings ? (
                <p className="text-xs text-muted-foreground">{plan.savings}</p>
              ) : null}
              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                {plan.href.startsWith("/") ? (
                  <Link to={plan.href} className="agri-btn-primary w-full justify-center">
                    {plan.cta}
                  </Link>
                ) : (
                  <a href={plan.href} className="agri-btn-primary w-full justify-center">
                    {plan.cta}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          AgriSmart keeps access free for farmers by partnering with cooperatives, NGOs, and governments committed to
          transforming agriculture.
        </p>
      </div>
    </section>
  );
}
