import type { ReactNode } from "react";

interface LandingShellProps {
  hero: ReactNode;
  card: ReactNode;
}

export function LandingShell({ hero, card }: LandingShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#f5efe6] via-[#f6f9f5] to-[#eef3fb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-success/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center gap-10 px-6 py-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-16">
        {hero}
        {card}
      </div>
    </div>
  );
}
