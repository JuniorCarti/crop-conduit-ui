import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";

const sections = [
  {
    heading: "Human-in-the-Loop Validation",
    body: "AI recommendations are reviewed by agronomy experts and field teams before scaling.",
  },
  {
    heading: "Local Agronomy Context",
    body: "Models are adapted to local farming conditions and seasonal patterns.",
  },
  {
    heading: "Bias Prevention",
    body: "We test for bias and calibrate models to avoid disadvantaging communities or crops.",
  },
  {
    heading: "Assistive, Not Authoritative",
    body: "AI is a decision-support tool. Farmers retain full decision-making power.",
  },
];

export default function ResponsibleAIPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="py-12">
          <div className="app-page-shell max-w-4xl space-y-6">
            <div className="space-y-2">
              <p className="agri-section-label">Policy</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">Responsible AI Policy</h1>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Last updated: March 19, 2026
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => window.print()} className="agri-btn-secondary">
                  Download PDF
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.heading} className="agri-card space-y-2">
                  <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                  <p className="text-sm text-muted-foreground">{section.body}</p>
                </div>
              ))}
            </div>

            <div className="agri-card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Have questions about our data practices?</h3>
                <p className="mt-1 text-sm text-muted-foreground">We are happy to clarify any policy details.</p>
              </div>
              <a href="/#contact" className="agri-btn-primary">
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
