import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, CloudRain, Thermometer, TrendingUp, Sprout, Zap } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
});

const floatAnim = {
  animate: {
    y: [0, -10, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
  },
};

const pulseAnim = {
  animate: {
    scale: [1, 1.4, 1],
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const intelligenceData = [
  {
    icon: CloudRain,
    label: "Rainfall Forecast",
    value: "84%",
    status: "Favorable",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    dot: "bg-sky-400",
  },
  {
    icon: Thermometer,
    label: "Frost Alert",
    value: "Moderate",
    status: "Risk",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  {
    icon: TrendingUp,
    label: "Maize Price",
    value: "KES 4,500",
    status: "↑ 3.2%",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  {
    icon: Sprout,
    label: "AI Planting",
    value: "Favorable",
    status: "Recommended",
    color: "text-lime-400",
    bg: "bg-lime-400/10",
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

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden text-white"
      style={{ backgroundImage: "url('/images/africa.jpg')" }}
    >
      {/* Background video with subtle zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      >
        <video
          className="h-full w-full object-cover"
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

      {/* Layered overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      {/* Atmospheric green glow */}
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-emerald-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-lime-400/8 blur-[80px]" />

      {/* Main content */}
      <div className="relative app-page-shell flex min-h-screen items-center">
        <div className="flex w-full flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">

          {/* ── Left: Text content ── */}
          <div className="max-w-lg flex-shrink-0 pb-8 pt-28 lg:pb-0 lg:pt-0">

            {/* Badge */}
            <motion.div {...fadeUp(0)}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300 backdrop-blur-sm">
                <motion.span {...pulseAnim} className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <Leaf className="h-3 w-3" />
                Farm Intelligence Platform
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              {...fadeUp(0.1)}
              className="mt-5 font-heading text-[2.6rem] font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-[3.25rem]"
            >
              The Command Center
              <br />
              <span className="mt-1 block">
                for{" "}
                <span className="agri-animated-highlight">
                  Modern Agriculture
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              {...fadeUp(0.2)}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65"
            >
              Climate & market intelligence for resilient smallholder farming
              across Africa — powered by AI.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-emerald-700/50 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
              >
                <Zap className="h-4 w-4" />
                Start Farming Smarter
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm transition duration-300 hover:border-white/35 hover:bg-white/15 hover:text-white"
              >
                Sign In
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div {...fadeUp(0.4)} className="mt-9 space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
                Trusted by farmers, innovators & climate resilience communities
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/45 backdrop-blur-sm transition hover:border-white/20 hover:text-white/60"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right: Floating Intelligence Card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
            className="hidden w-full max-w-[300px] flex-shrink-0 pb-8 pt-28 lg:block lg:pb-0 lg:pt-0"
          >
            <motion.div {...floatAnim}>
              {/* Card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/8 p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                {/* Card glow */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/15 blur-[40px]" />

                {/* Card header */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                      AgriSmart AI
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      Field Intelligence
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1">
                    <motion.span {...pulseAnim} className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-semibold text-emerald-400">Live</span>
                  </div>
                </div>

                {/* Intelligence rows */}
                <div className="space-y-2.5">
                  {intelligenceData.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                      className={`flex items-center justify-between rounded-xl border border-white/6 ${item.bg} px-3.5 py-2.5`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/8`}>
                          <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] text-white/45">{item.label}</p>
                          <p className="text-xs font-semibold text-white">{item.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                          className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
                        />
                        <span className={`text-[10px] font-medium ${item.color}`}>{item.status}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Card footer */}
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                  <p className="text-[10px] text-white/30">Updated just now</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-white/30">Powered by</span>
                    <span className="text-[10px] font-semibold text-emerald-400/70">AgriSmart AI</span>
                  </div>
                </div>
              </div>

              {/* Subtle reflection */}
              <div className="mx-4 h-3 rounded-b-2xl bg-white/5 blur-sm" />
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
    </section>
  );
}
