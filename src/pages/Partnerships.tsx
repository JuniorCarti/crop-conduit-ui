import { useMemo, useState } from "react";
import { Building2, Leaf, LineChart, Users, Globe, FlaskConical, Landmark, Handshake, Blocks } from "lucide-react";
import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";

const whyPartner = [
  {
    title: "Access to Farmer Networks",
    description: "Work directly with cooperatives and farmer groups.",
    icon: Users,
  },
  {
    title: "Data-Driven Insights",
    description: "Leverage climate and market intelligence tools.",
    icon: LineChart,
  },
  {
    title: "Scalable Solutions",
    description: "Pilot and scale innovations across regions.",
    icon: Blocks,
  },
  {
    title: "Impact-Driven Collaboration",
    description: "Contribute to improving farmer livelihoods.",
    icon: Leaf,
  },
];

const partnerTypes = [
  { title: "Farmer Cooperatives", icon: Users },
  { title: "NGOs & Development Organizations", icon: Handshake },
  { title: "Research Institutions", icon: FlaskConical },
  { title: "Agribusiness Companies", icon: Building2 },
  { title: "Government & Policy Institutions", icon: Landmark },
];

const opportunities = [
  {
    title: "Pilot Program Collaboration",
    description: "Co-design pilot deployments to validate climate and market intelligence workflows.",
  },
  {
    title: "Data & Research Partnerships",
    description: "Collaborate on localized data collection, modeling, and evaluation.",
  },
  {
    title: "Technology Integration",
    description: "Integrate AgriSmart insights into your existing platforms and services.",
  },
  {
    title: "Community Outreach Programs",
    description: "Support farmer training, onboarding, and adoption at the community level.",
  },
];

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export default function Partnerships() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interest, setInterest] = useState("");
  const wordCount = useMemo(() => countWords(interest), [interest]);
  const wordLimit = 400;

  const handleScrollToForm = (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById("partnership-form");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const requiredFields = ["orgName", "contactName", "email", "phone", "orgType", "location", "interest"];
    for (const field of requiredFields) {
      const value = formData.get(field);
      if (!value) {
        setError("Please complete all required fields before submitting.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://formcarry.com/s/6rfNpQfaxhh", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        setError("Submission failed. Please try again.");
        return;
      }

      form.reset();
      setInterest("");
      setSubmitted(true);
    } catch (err) {
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="relative overflow-hidden pb-12 pt-16">
          <div className="absolute inset-0 bg-[url('/images/africa.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/20" />
          <div className="app-page-shell relative space-y-6">
            <div className="max-w-2xl text-white">
              <p className="agri-section-label text-white/80">Partner With AgriSmart</p>
              <h1 className="font-heading text-4xl font-semibold leading-tight sm:text-5xl">
                Partner With AgriSmart
              </h1>
              <p className="mt-4 text-sm text-white/85 sm:text-base">
                We collaborate with organizations to empower farmers through data-driven solutions, climate intelligence,
                and market access.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={handleScrollToForm} className="agri-btn-primary">
                  Apply for Partnership
                </button>
                <a href="#why-partner" className="agri-btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="why-partner" className="py-12">
          <div className="app-page-shell space-y-6">
            <div className="max-w-3xl">
              <p className="agri-section-label">Why Partner With AgriSmart</p>
              <h2 className="agri-section-title">Why Partner With AgriSmart</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {whyPartner.map((item) => (
                <div
                  key={item.title}
                  className="agri-card flex h-full flex-col gap-3 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="app-page-shell space-y-6">
            <div className="max-w-3xl">
              <p className="agri-section-label">Who We Work With</p>
              <h2 className="agri-section-title">Who We Work With</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partnerTypes.map((item) => (
                <div key={item.title} className="agri-card flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="app-page-shell space-y-6">
            <div className="max-w-3xl">
              <p className="agri-section-label">Partnership Opportunities</p>
              <h2 className="agri-section-title">Partnership Opportunities</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {opportunities.map((item) => (
                <div key={item.title} className="agri-card space-y-2">
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="partnership-form" className="py-12">
          <div className="app-page-shell space-y-6">
            <div className="max-w-3xl">
              <p className="agri-section-label">Partnership Application</p>
              <h2 className="agri-section-title">Apply for Partnership</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Share a few details about your organization and we’ll get back to you shortly.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-3xl bg-primary/10 px-6 py-8 text-center shadow-lg">
                <p className="text-2xl font-semibold text-primary">
                  Thank you for your interest in partnering with AgriSmart. Our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <form
                action="https://formcarry.com/s/6rfNpQfaxhh"
                method="POST"
                encType="multipart/form-data"
                className="agri-card space-y-4"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="formType" value="Partnership" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Organization Name
                    <input
                      type="text"
                      name="orgName"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Contact Person Name
                    <input
                      type="text"
                      name="contactName"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Email
                    <input
                      type="email"
                      name="email"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Phone
                    <input
                      type="tel"
                      name="phone"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Organization Type
                    <select
                      name="orgType"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    >
                      <option value="">Select a type</option>
                      {partnerTypes.map((item) => (
                        <option key={item.title} value={item.title}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Country / Location
                    <input
                      type="text"
                      name="location"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    Website (optional)
                    <input
                      type="url"
                      name="website"
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground sm:col-span-2">
                    Partnership Interest
                    <textarea
                      name="interest"
                      rows={4}
                      value={interest}
                      onChange={(event) => setInterest(event.target.value)}
                      className="w-full rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm text-foreground outline-none focus:border-primary/40"
                      required
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {wordCount} / {wordLimit} words
                      </span>
                      {wordCount > wordLimit ? <span className="text-destructive">Please keep it under 400 words.</span> : null}
                    </div>
                  </label>
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <button type="submit" className="agri-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Partnership Request"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
