import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { Link } from "react-router-dom";

type Plan = {
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  billing: "forever" | "per month";
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
  badge?: string;
  savings?: string;
  trial?: string;
  tone: "primary" | "secondary" | "success";
};

const plans: Plan[] = [
  {
    name: "Farmer Access",
    description: "Designed for individual smallholder farmers to access essential decision-making data before planting.",
    priceMonthly: "Free Forever",
    priceYearly: "Free Forever",
    billing: "forever",
    features: [
      "📊 Real-time market price alerts for major crops",
      "🌦 Localized climate and weather forecasts",
      "🌦 Planting window recommendations based on forecast data",
      "🤝 SMS alerts for farmers with low internet access",
      "🤝 Access to buyer marketplace to discover potential buyers",
      "📈 Mobile-friendly dashboard",
    ],
    cta: "Get Started Free",
    href: "/signup",
    tone: "success",
  },
  {
    name: "Cooperative Plan",
    description: "Designed for farmer cooperatives and member-based organizations managing multiple farmers.",
    priceMonthly: "KSh 12,000",
    priceYearly: "KSh 120,000",
    billing: "per month",
    savings: "Save KSh 24,000 with yearly billing",
    trial: "60-day free trial",
    highlight: true,
    features: [
      "📈 Manage and monitor up to 500 farmers",
      "📊 Cooperative-level market price dashboards",
      "🌦 Regional climate forecasting insights",
      "🌦 Planting decision support for cooperative members",
      "📊 Market demand signals and price trends",
      "🤝 Tools to connect cooperative farmers with buyers",
      "📈 Cooperative analytics and production insights",
    ],
    cta: "Start 60-Day Free Trial",
    href: "/signup",
    tone: "primary",
  },
  {
    name: "Government / NGO Plan",
    description: "Designed for government agricultural programs, NGOs, and large-scale agricultural initiatives.",
    priceMonthly: "KSh 75,000",
    priceYearly: "KSh 750,000",
    billing: "per month",
    savings: "Save KSh 150,000 with yearly billing",
    badge: "Institutional Plan",
    features: [
      "📈 Large-scale farmer program management",
      "📊 County or national agricultural dashboards",
      "📊 Market price intelligence across regions",
      "🌦 Climate forecasting insights for agricultural planning",
      "📈 Impact monitoring and reporting tools",
      "📊 API integrations for external systems",
      "🤝 Dedicated technical support",
    ],
    cta: "Contact Sales",
    href: "#contact",
    tone: "secondary",
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const toggleBilling = () => {
    setBilling((prev) => (prev === "monthly" ? "yearly" : "monthly"));
  };

  return (
    <section id="pricing" className="py-12">
      <div className="app-page-shell space-y-10">
        <div className="text-center">
          <h2 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">
            Simple Pricing for Smarter Farming Decisions
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
            AgriSmart empowers farmers, cooperatives, and agricultural organizations with real-time market intelligence
            and climate forecasting to make better planting and selling decisions.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 text-sm font-semibold text-muted-foreground">
          <span className={billing === "monthly" ? "text-foreground" : ""}>Monthly</span>
          <button
            type="button"
            onClick={toggleBilling}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-primary transition hover:border-primary/40"
            aria-label="Toggle billing frequency"
          >
            {billing === "monthly" ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5" />}
            <span>Yearly (Save up to 20%)</span>
          </button>
          <span className={billing === "yearly" ? "text-foreground" : ""}>Yearly</span>
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
                plan.highlight ? "border-primary/50 bg-primary/5 shadow-lg scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">{plan.name}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
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

              <div>
                <p className="text-3xl font-semibold text-foreground">
                  {billing === "monthly" ? plan.priceMonthly : plan.priceYearly}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.billing === "forever"
                    ? "Free forever"
                    : billing === "monthly"
                      ? "per month"
                      : "per year"}
                </p>
                {billing === "yearly" && plan.savings ? (
                  <p className="mt-2 text-xs text-muted-foreground">{plan.savings}</p>
                ) : null}
              </div>

              {plan.trial ? (
                <p className="text-sm font-semibold text-emerald-700">{plan.trial}</p>
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
                  <Link
                    to={plan.href}
                    className={`w-full justify-center ${
                      plan.tone === "secondary" ? "agri-btn-secondary" : "agri-btn-primary"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <a
                    href={plan.href}
                    className={`w-full justify-center ${
                      plan.tone === "secondary" ? "agri-btn-secondary" : "agri-btn-primary"
                    }`}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="agri-card text-center">
          <h3 className="text-xl font-semibold text-foreground">Built for Africa’s Smallholder Farmers</h3>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1">
              Supports climate-smart agriculture
            </span>
            <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1">
              Helps reduce post-harvest losses
            </span>
            <span className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1">
              Connects farmers directly to markets
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
