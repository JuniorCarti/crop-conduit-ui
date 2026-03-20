import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";

const sections = [
  {
    heading: "Preamble and Guiding Principles",
    body:
      "This Partnership Ethics Policy establishes the framework for all collaborations involving AgriSmart. We recognize that our partners extend our mission to empower farmers with data-driven insights. We are committed to a network of collaborators who share integrity, transparency, and respect for the people and communities we serve.",
  },
  {
    heading: "Community-First Approach",
    body:
      "Partnerships should be transformational, delivering tangible outcomes for farmers and their communities. Every partnership is evaluated, structured, and managed with this principle at its core.",
  },
  {
    heading: "No Data Exploitation: Stewardship of Farmer Information",
    body:
      "Farmer-generated data, including personal information, agricultural practices, financial details, and land usage data, is treated as a trust. Partners may use data only within the explicit scope of the collaboration.",
    list: [
      "Explicit consent and purpose limitation in plain language",
      "Data minimization and anonymization where possible",
      "Strong data security and data sovereignty commitments",
      "Prohibition on algorithmic harm, predatory pricing, or manipulation",
    ],
  },
  {
    heading: "Consequences of Violation",
    body:
      "Any breach of this clause is a material breach of the partnership agreement, leading to termination, potential legal action, and permanent disqualification from future collaboration.",
  },
  {
    heading: "Ethical Partner Screening",
    body:
      "AgriSmart conducts rigorous due diligence to ensure partners align with farmer rights and community benefit.",
    list: [
      "Legal and regulatory history review",
      "Corporate structure and funding assessment",
      "Reputation and track record review",
      "Values alignment interview",
      "Conflict of interest disclosure",
      "Right to refuse or terminate partnerships",
    ],
  },
  {
    heading: "NGO and Government Collaboration",
    body:
      "Public sector partnerships require added transparency and accountability. Agreements define roles, responsibilities, and strict data-sharing protocols, and are overseen by joint accountability mechanisms.",
    list: [
      "Transparent governance frameworks",
      "Public benefit mandate",
      "Safeguarding farmer autonomy and opt-out rights",
    ],
  },
  {
    heading: "Community-First Execution",
    body:
      "Every partnership must demonstrate value to farmers and respect local context, knowledge, and agency.",
    list: [
      "Clear value proposition and co-developed metrics",
      "Respect for local context, language, and practices",
      "Free, Prior, and Informed Consent (FPIC)",
      "Long-term commitment and responsible exit strategy",
    ],
  },
  {
    heading: "Governance, Reporting, and Enforcement",
    list: [
      "Ethics Review Board oversight",
      "Annual public transparency report",
      "Whistleblower protection and confidential reporting",
    ],
  },
];

export default function PartnershipEthicsPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="py-12">
          <div className="app-page-shell max-w-4xl space-y-6">
            <div className="space-y-2">
              <p className="agri-section-label">Policy</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">
                AgriSmart Partnership Ethics Policy
              </h1>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Last updated: March 19, 2026
              </p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Document Version: 2.0</p>
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
                <h3 className="text-lg font-semibold text-foreground">
                  Have questions about our data practices or partnership principles?
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact our Ethics and Compliance Officer at ethics@agrismart.com or call +1 (800) 555-FARM.
                </p>
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
