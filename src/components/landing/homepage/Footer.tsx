import { Link } from "react-router-dom";
import { Github, Instagram, Linkedin, Twitter } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Market Intelligence", href: "#benefits" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Careers", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Login", to: "/login" },
      { label: "Signup", to: "/signup" },
      { label: "Dashboard", to: "/dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#contact" },
      { label: "Terms", href: "#contact" },
      { label: "Security", href: "#contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/40 bg-white/60 py-12 text-foreground">
      <div className="app-page-shell grid gap-10 lg:grid-cols-[1.2fr_2.2fr]">
        <div>
          <Link to="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              AS
            </span>
            AgriSmart
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            AgriSmart unifies climate signals, crop performance, and market intelligence into one actionable farm command
            center.
          </p>
          <div className="mt-6 flex items-center gap-3 text-muted-foreground">
            <a href="#" className="rounded-full border border-primary/15 p-2 transition hover:text-foreground" aria-label="Twitter">
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/agrismartkenyainc/"
              className="rounded-full border border-primary/15 p-2 transition hover:text-foreground"
              aria-label="LinkedIn"
              target="_blank"
              rel="noreferrer"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="https://www.instagram.com/p/DV8On0GDbKq/?utm_source=ig_web_copy_link"
              className="rounded-full border border-primary/15 p-2 transition hover:text-foreground"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="rounded-full border border-primary/15 p-2 transition hover:text-foreground" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-foreground">{column.title}</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to} className="transition hover:text-foreground">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="transition hover:text-foreground">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="app-page-shell mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/60 pt-6 text-xs text-muted-foreground">
        <span>© 2026 AgriSmart - Farm Intelligence. All rights reserved.</span>
        <span>Built for resilient agriculture.</span>
      </div>
    </footer>
  );
}
