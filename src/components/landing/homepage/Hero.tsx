import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Leaf,
  CloudRain,
  Thermometer,
  TrendingUp,
  Sprout,
  Zap,
} from "lucide-react";

/* ─── Animation helpers ─────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1], delay },
});

const floatAnim = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

const livePulse = (delay = 0) => ({
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.6, 1, 0.6],
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut", delay },
  },
});

/* ─── Data ───────────────────────────────────────────────────── */
const intelligenceData = [
  {
    icon: CloudRain,
    label: "Rainfall Forecast",
    value: "84%",
    status: "Favorable",
    color: "text-sky-300",
    bg: "bg-sky-400/8",
    border: "border-sky-400/15",
    dot: "bg-sky-400",
  },
  {
    icon: Thermometer,
    label: "Frost Alert",
    value: "Moderate",
    status: "Risk",
    color: "text-amber-300",
    bg: "bg-amber-400/8",
    border: "border-amber-400/15",
    dot: "bg-amber-400",
  },
  {
    icon: TrendingUp,
    label: "Maize Market",
    value: "KES 4,500",
    status: "↑ 3.2%",
    color: "text-emerald-300",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/15",
    dot: "bg-emerald-400",
  },
  {
    icon: Sprout,
    label: "AI Planting",
    value: "Favorable",
    status: "Recommended",
    color: "text-lime-300",
    bg: "bg-lime-400/8",
    border: "border-lime-400/15",
    dot: "bg-lime-400",
  },
];

const trustBadges = [
  "AWS",
  "OpenAI",
  "SOMO Africa",
  "U.S. Embassy",
  "Plogging Kenya",
];

/* ─── Component ──────────────────────────────────────────────── */
export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden text-white"
      style={{ backgroundImage: "url('/images/africa.jpg')" }}
    >
      {/* ── Background video — slow cinematic zoom-out ── */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 10, ease: "easeOut" }}
      >
        <video
          className="h-full w-full object-cover brightness-90"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/africa.jpg"
          id="bg-video"
          aria-hidden="true"
        >
          <source src="/videos/background.mp4" type="video/mp4" />
          <source src="/videos/background.webm" type="video/webm" />
        </video>
      </motion.div>

      {/* ── Layered overlays ── */}
      {/* Left-to-right: heavy dark on left, fades right */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/15" />
      {/* Top-to-bottom: subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />

      {/* ── Atmospheric green glow ── */}
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[500px] w-[500px] rounded-full bg-emerald-600/18 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-emerald-500/8 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/3 h-56 w-56 rounded-full bg-lime-400/6 blur-[90px]" />

      {/* ── Main content shell ── */}
      <div className="relative app-page-shell flex min-h-screen items-center">
        <div className="flex w-full flex-col items-start justify-between gap-10 py-32 lg:flex-row lg:items-center lg:py-0">

          {/* ════════════════════════════════════════
              LEFT — Text content
          ════════════════════════════════════════ */}
          <div className="w-full max-w-[520px] flex-shrink-0">

            {/* Platform badge */}
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300 backdrop-blur-md">
                <motion.span
                  {...livePulse(0)}
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                />
                <Leaf className="h-3 w-3 opacity-80" />
                Farm Intelligence Platform
              </span>
            </motion.div>

            {/* ── Headline ── */}
            <motion.h1
              {...fadeUp(0.12)}
              className="mt-6 font-heading font-bold tracking-[-0.02em] leading-[1.06]"
            >
              {/* Line 1 — smaller weight */}
              <span className="block text-[2.15rem] font-semibold text-white/90 sm:text-[2.6rem] md:text-[3rem]">
                The Command Center
              </span>
              {/* Line 2 — dominant */}
              <span className="block text-[2.4rem] sm:text-[3rem] md:text-[3.5rem]">
                for{" "}
                <span
                  className="agri-animated-highlight"
                  style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
                >
                  Modern Agriculture
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...fadeUp(0.22)}
              className="mt-5 max-w-[420px] text-[15px] leading-[1.75] text-white/60"
            >
              Climate & market intelligence for resilient smallholder farming
              across Africa — powered by AI.
            </motion.p>

            {/* ── CTA buttons ── */}
            <motion.div
              {...fadeUp(0.32)}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {/* Primary */}
              <Link
                to="/signup"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-800/40 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                {/* Subtle inner glow on hover */}
                <span className="absolute inset-0 rounded-full bg-white/0 transition-all duration-300 group-hover:bg-white/8" />
                <Zap className="relative h-3.5 w-3.5" />
                <span className="relative">Start Farming Smarter</span>
                <ArrowRight className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              {/* Secondary */}
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold text-white/85 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/12 hover:text-white hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </motion.div>

            {/* ── Trust indicators ── */}
            <motion.div {...fadeUp(0.42)} className="mt-10 space-y-3">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.2em] text-white/30">
                Trusted by farmers, innovators & climate resilience communities
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-lg border border-white/8 bg-white/4 px-3 py-1 text-[11px] font-medium text-white/38 backdrop-blur-sm transition-all duration-200 hover:border-white/18 hover:text-white/55"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ════════════════════════════════════════
              RIGHT — Floating AI Intelligence Card
          ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 48, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="hidden w-full max-w-[290px] flex-shrink-0 lg:block"
          >
            {/* Ambient glow behind card */}
            <div className="pointer-events-none absolute -inset-8 rounded-3xl bg-emerald-500/10 blur-[50px]" />

            <motion.div {...floatAnim} className="relative">
              {/* ── Card ── */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl">

                {/* Inner top-right glow */}
                <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-emerald-500/20 blur-[35px]" />
                <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-lime-400/10 blur-[30px]" />

                {/* Card header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-white/35">
                      AgriSmart AI
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-white/90">
                      Field Intelligence
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 backdrop-blur-sm">
                    <motion.span
                      {...livePulse(0)}
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                    />
                    <span className="text-[10px] font-semibold text-emerald-400">
                      Live
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-3.5 h-px bg-white/6" />

                {/* Intelligence rows */}
                <div className="space-y-2">
                  {intelligenceData.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.55 + i * 0.1,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`flex items-center justify-between rounded-xl border ${item.border} ${item.bg} px-3.5 py-2.5`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/6">
                          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-[9.5px] text-white/40">{item.label}</p>
                          <p className="text-[12px] font-semibold text-white/90">
                            {item.value}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 2.8,
                            repeat: Infinity,
                            delay: i * 0.5,
                          }}
                          className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
                        />
                        <span className={`text-[10px] font-medium ${item.color}`}>
                          {item.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3">
                  <p className="text-[9.5px] text-white/25">Updated just now</p>
                  <p className="text-[9.5px] font-semibold text-emerald-400/60">
                    AgriSmart AI
                  </p>
                </div>
              </div>

              {/* Card reflection */}
              <div className="mx-6 h-2.5 rounded-b-2xl bg-white/4 blur-[3px]" />
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* ── Bottom fade into next section ── */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />
    </section>
  );
}
