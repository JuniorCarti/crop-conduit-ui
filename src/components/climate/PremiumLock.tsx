interface PremiumLockProps {
  locked: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  onUpgrade?: () => void;
  children: React.ReactNode;
}

export function PremiumLock({ children }: PremiumLockProps) {
  return (
    <div className="relative">{children}</div>
  );
}
