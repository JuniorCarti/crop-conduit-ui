import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";

const sections = [
  {
    heading: "Legal Foundation (Kenya)",
    body:
      "AgriSmart aligns with the Data Protection Act (Kenya) 2019, applying lawful, fair, and transparent processing; purpose limitation; data minimization; accuracy; storage limitation; integrity; and confidentiality.",
  },
  {
    heading: "Farmer Rights",
    list: [
      "Right to be informed",
      "Right to access data",
      "Right to correction",
      "Right to deletion",
      "Right to object",
    ],
  },
  {
    heading: "Consent Mechanism",
    list: [
      "Explicit opt-in for data collection",
      "Simple-language consent forms",
      "Withdrawal of consent at any time",
    ],
  },
  {
    heading: "Data Collected",
    list: [
      "Approximate farm location (not invasive)",
      "Crop and production data",
      "Market interactions and pricing signals",
    ],
  },
  {
    heading: "Cross-Border Data Transfers (East Africa)",
    list: [
      "Data may be processed in Kenya, Uganda, and Tanzania",
      "Transfers only where adequate safeguards exist",
      "Contracts ensure data protection compliance",
      "No transfer to unsafe jurisdictions",
    ],
  },
];

export default function DataPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="py-12">
          <div className="app-page-shell max-w-4xl space-y-6">
            <div className="space-y-2">
              <p className="agri-section-label">Policy</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">
                Data Privacy & Consent Policy
              </h1>
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
                  {section.body ? <p className="text-sm text-muted-foreground">{section.body}</p> : null}
                  {section.list ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {section.list.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
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
