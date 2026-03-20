import { Navbar } from "@/components/landing/homepage/Navbar";
import { Footer } from "@/components/landing/homepage/Footer";
import { Link } from "react-router-dom";

const policies = [
  { title: "Data Privacy & Consent", href: "/policies/data-privacy" },
  { title: "Security", href: "/policies/security" },
  { title: "Responsible AI", href: "/policies/responsible-ai" },
  { title: "Transparency", href: "/policies/transparency" },
  { title: "Data Ownership", href: "/policies/data-ownership" },
  { title: "Partnership Ethics", href: "/policies/partnership-ethics" },
];

export default function Policies() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <section className="py-12">
          <div className="app-page-shell space-y-6">
            <div className="max-w-3xl">
              <p className="agri-section-label">Policies</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-4xl">
                Data Privacy, Security, and Responsible AI
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                AgriSmart is committed to protecting farmer data, ensuring transparency, and operating with responsible
                AI practices aligned with global standards.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {policies.map((policy) => (
                <div key={policy.title} className="agri-card space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">{policy.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    View the full policy details, legal references, and governance practices.
                  </p>
                  <Link to={policy.href} className="text-sm font-semibold text-primary hover:underline">
                    Read policy {"\u2192"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
