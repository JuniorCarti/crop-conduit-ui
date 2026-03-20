import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";

const sections = [
  {
    heading: "Encryption Standards",
    body: "Data is encrypted in transit and at rest to protect sensitive farmer and organizational information.",
  },
  {
    heading: "Secure Cloud Hosting",
    body: "We use secure cloud infrastructure with hardened environments and continuous monitoring.",
  },
  {
    heading: "Role-Based Access Control (RBAC)",
    body: "Access is restricted by role, ensuring only authorized users can view or manage data.",
  },
  {
    heading: "Audit Logs",
    body: "Critical system actions are logged to ensure accountability and traceability.",
  },
  {
    heading: "Incident Response & Breach Notification",
    body:
      "We maintain an incident response plan and align breach notification with Kenyan data protection requirements.",
  },
];

export default function SecurityPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="py-12">
          <div className="app-page-shell max-w-4xl space-y-6">
            <div className="space-y-2">
              <p className="agri-section-label">Policy</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">Security Policy</h1>
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
