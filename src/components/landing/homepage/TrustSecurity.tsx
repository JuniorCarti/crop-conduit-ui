import { ShieldCheck, Lock, Brain, Eye, Database, Handshake } from "lucide-react";
import { Link } from "react-router-dom";

const principles = [
  {
    title: "Data Privacy & Consent",
    icon: ShieldCheck,
    description: "We collect only essential data with full farmer consent and transparency.",
    href: "/policies/data-privacy",
  },
  {
    title: "Secure Infrastructure",
    icon: Lock,
    description: "Secure cloud hosting, encryption, and access controls protect sensitive data.",
    href: "/policies/security",
  },
  {
    title: "Responsible AI",
    icon: Brain,
    description: "AI is human-validated, locally adapted, and designed for explainability.",
    href: "/policies/responsible-ai",
  },
  {
    title: "Transparency & Explainability",
    icon: Eye,
    description: "Recommendations are traceable, with clear reasoning and data sources.",
    href: "/policies/transparency",
  },
  {
    title: "Data Ownership",
    icon: Database,
    description: "Farmers own their data and control how it is used and shared.",
    href: "/policies/data-ownership",
  },
  {
    title: "Ethical Partnerships",
    icon: Handshake,
    description: "We work only with partners who respect farmer rights and community benefit.",
    href: "/policies/partnership-ethics",
  },
];

const trustMetrics = [
  { value: "100%", label: "Farmer consent driven" },
  { value: "0", label: "Data sold to third parties" },
  { value: "Encrypted", label: "End-to-end" },
  { value: "Audit-ready", label: "Systems" },
];

const compliance = [
  "Data Protection Act (Kenya) 2019",
  "East Africa regional alignment",
  "GDPR-inspired principles",
  "AI ethics frameworks",
];

export function TrustSecurity() {
  return (
    <section className="py-16 md:py-20">
      <div className="app-page-shell space-y-8">
        <div className="max-w-3xl">
          <p className="agri-kicker">Trust & Data Ethics</p>
          <h2 className="agri-display mt-4">
            Security, Privacy, and Responsible AI {"\u2014"} Built for Farmer Trust
          </h2>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            AgriSmart is designed with farmer trust at its core. From data collection to AI recommendations, every step
            is built to ensure privacy, security, transparency, and accountability.
          </p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-white/80 p-4 text-center shadow-lg backdrop-blur">
          <p className="text-sm font-semibold text-foreground">Trust Guarantee Banner</p>
          <p className="mt-1 text-sm text-muted-foreground">Your data is never sold. Ever.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border/50 bg-white/80 p-5 shadow-lg backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="mt-4 space-y-3">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <Link to={item.href} className="text-sm font-semibold text-primary hover:underline">
                  Learn more {"\u2192"}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustMetrics.map((metric) => (
            <div key={metric.label} className="agri-card text-center">
              <p className="text-xl font-semibold text-foreground">{metric.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="agri-card space-y-4">
          <div>
            <p className="agri-section-label">Aligned with Global Standards</p>
            <h3 className="text-lg font-semibold text-foreground">Aligned with Global Standards</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Our platform is designed to comply with Kenya's Data Protection Act and is adaptable to regional
              regulations across East Africa. As we expand, we ensure compliance with local data protection authorities
              and international best practices.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {compliance.map((item) => (
              <span
                key={item}
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="agri-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Partner with a platform built on trust, transparency, and responsible innovation.
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/partnerships" className="agri-btn-primary">
              Become a Partner
            </a>
            <a href="/policies" className="agri-btn-secondary">
              Learn More About Our Policies
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


