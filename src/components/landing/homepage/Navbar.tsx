import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Home", href: "#top" },
  { label: "Features", href: "#features" },
  { label: "Partners", href: "#partners" },
  { label: "Partnerships", to: "/partnerships" },
  { label: "Pricing", href: "#pricing" },
  { label: "Team", href: "#team" },
  { label: "Careers", href: "#careers" },
  { label: "Donate", href: "#donate", isButton: true },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const resolveHref = (href?: string) => {
    if (!href) return "#";
    return isHome ? href : `/${href}`;
  };
  const isOverlay = isHome && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`sticky top-0 z-50 transition ${
        isOverlay
          ? "border-b border-white/10 bg-black/30 text-white backdrop-blur-lg"
          : "border-b border-white/60 bg-white/80 text-foreground backdrop-blur-xl shadow-sm"
      }`}
    >
      <div className="app-page-shell grid items-center gap-6 py-4 lg:grid-cols-[auto_1fr_auto]">
        <Link
          to="/"
          className={`flex items-center gap-2 font-heading text-lg font-semibold ${
            isOverlay ? "text-white" : "text-foreground"
          }`}
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
              isOverlay ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
            }`}
          >
            AS
          </span>
          AgriSmart
        </Link>

        <nav
          className={`hidden items-center justify-center gap-4 text-sm font-medium lg:flex ${
            isOverlay ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {navItems.map((item) => {
            const isActive = isHome && item.label === "Home";
            const activeClass = isActive
              ? "relative after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#9BE15D]"
              : "";
            return item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className={`transition ${activeClass} ${isOverlay ? "hover:text-white" : "hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={resolveHref(item.href)}
                className={
                  item.isButton
                    ? isOverlay
                      ? "rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-white/20"
                      : "rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                    : `transition ${activeClass} ${isOverlay ? "hover:text-white" : "hover:text-foreground"}`
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-3">
          <Link
            to="/login"
            className={
              isOverlay
                ? "agri-btn-secondary border-white/40 bg-white/10 text-white hover:bg-white/20"
                : "agri-btn-secondary"
            }
          >
            Sign In
          </Link>
          <Link to="/signup" className="agri-btn-primary">
            Get Started
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition lg:hidden ${
              isOverlay
                ? "border-white/40 text-white hover:bg-white/10"
                : "border-primary/20 text-foreground hover:bg-primary/5"
            }`}
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
              {navItems.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="transition hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={resolveHref(item.href)}
                    className={item.isButton ? "agri-btn-primary w-full justify-center" : "transition hover:text-foreground"}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
