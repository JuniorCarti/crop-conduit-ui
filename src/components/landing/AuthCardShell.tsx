import type { ReactNode } from "react";

interface AuthCardShellProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function AuthCardShell({ children, className, containerClassName, id }: AuthCardShellProps) {
  return (
    <section className={`w-full max-w-md lg:justify-self-end ${containerClassName ?? ""}`} id={id}>
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/50 bg-white/75 p-6 shadow-2xl shadow-black/10 backdrop-blur-2xl md:p-8 dark:border-white/10 dark:bg-card/70 ${className ?? ""}`}
      >
        <div className="absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-white/80 to-transparent opacity-70" />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}
