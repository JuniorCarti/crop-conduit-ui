import type { ReactNode } from "react";

interface HeroPanelProps {
  children: ReactNode;
  className?: string;
}

export function HeroPanel({ children, className }: HeroPanelProps) {
  return (
    <section className={`flex w-full flex-col gap-6 lg:gap-8 ${className ?? ""}`}>
      {children}
    </section>
  );
}
