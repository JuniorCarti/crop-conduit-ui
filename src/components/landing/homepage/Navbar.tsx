import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Partners", href: "#partners" },
  { label: "Pricing", href: "#pricing" },
  { label: "Team", href: "#team" },
  { label: "Careers", href: "#careers" },
  { label: "Donate", href: "#donate", isButton: true },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl"
    >
      <div className="app-page-shell grid items-center gap-6 py-4 lg:grid-cols-[auto_1fr_auto]">
        <Link to="/" className="flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            AS
          </span>
          AgriSmart
        </Link>

        <nav className="hidden items-center justify-center gap-4 text-sm font-medium text-muted-foreground lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={
                item.isButton
                  ? "rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  : "transition hover:text-foreground"
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Link to="/login" className="agri-btn-secondary">
            Sign In
          </Link>
          <Link to="/signup" className="agri-btn-primary">
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 text-foreground transition hover:bg-primary/5 lg:hidden"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/40 bg-white/90 lg:hidden"
          >
            <div className="app-page-shell flex flex-col gap-4 py-6 text-sm font-medium text-foreground">
              <div className="flex flex-col gap-3">
                <Link to="/signup" className="agri-btn-primary w-full justify-center" onClick={() => setOpen(false)}>
                  Get Started
                </Link>
                <Link to="/login" className="agri-btn-secondary w-full justify-center" onClick={() => setOpen(false)}>
                  Sign In
                </Link>
              </div>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    item.isButton
                      ? "agri-btn-primary w-full justify-center"
                      : "transition hover:text-foreground"
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
