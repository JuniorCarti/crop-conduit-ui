import { cn } from "@/lib/utils";
import { brand } from "@/theme/brand";

type LogoVariant = "stacked" | "inline";
type LogoSize = "sm" | "md" | "lg";

type AgriSmartLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  className?: string;
};

const iconSizeMap: Record<LogoSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

const titleSizeMap: Record<LogoSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
};

const taglineSizeMap: Record<LogoSize, string> = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-sm",
};

const BRAND_COLORS = {
  agri: brand.colors.primaryGreen,
  dot: brand.colors.accentLime,
  smartStart: brand.colors.accentLime,
  smartEnd: brand.colors.accentLime2,
  icon: brand.colors.iconGreen,
  tagline: brand.colors.farmSubtext,
};

function SproutIcon({ size }: { size: LogoSize }) {
  return (
    <div className={cn("rounded-full flex items-center justify-center", iconSizeMap[size])} style={{ backgroundColor: "rgba(24,71,1,0.10)" }}>
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-[68%] w-[68%]">
        <path
          d="M31 52V34"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
          style={{ color: BRAND_COLORS.icon }}
        />
        <path
          d="M31 37c-9 0-16-7-16-16 9 0 16 7 16 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinejoin="round"
          style={{ color: BRAND_COLORS.icon }}
        />
        <path
          d="M33 33c0-9 7-16 16-16 0 9-7 16-16 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinejoin="round"
          style={{ color: BRAND_COLORS.icon }}
        />
        <path
          d="M20 52h24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
          style={{ color: BRAND_COLORS.icon, opacity: 0.8 }}
        />
      </svg>
    </div>
  );
}

function Wordmark({ size }: { size: LogoSize }) {
  return (
    <span className={cn("font-semibold leading-tight", titleSizeMap[size])}>
      <span style={{ color: BRAND_COLORS.agri }}>Agr</span>
      <span className="relative inline-block" style={{ color: BRAND_COLORS.agri }}>
        i
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{ top: "-0.25em", width: "0.26em", height: "0.26em", backgroundColor: BRAND_COLORS.dot }}
          aria-hidden="true"
        />
      </span>
      <span
        style={{
          background: `linear-gradient(90deg, ${BRAND_COLORS.smartStart} 0%, ${BRAND_COLORS.smartEnd} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Smart
      </span>
    </span>
  );
}

function Tagline({ size }: { size: LogoSize }) {
  return (
    <p
      className={cn("leading-tight", taglineSizeMap[size])}
      style={{ color: BRAND_COLORS.tagline, marginInlineStart: "4ch" }}
    >
      Farm Intelligence
    </p>
  );
}

export function AgriSmartLogo({
  variant = "inline",
  size = "md",
  showTagline = true,
  className,
}: AgriSmartLogoProps) {
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-start text-left", className)}>
        <SproutIcon size={size} />
        <p className="mt-2"><Wordmark size={size} /></p>
        {showTagline && <Tagline size={size} />}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SproutIcon size={size} />
      <div className="min-w-0">
        <p><Wordmark size={size} /></p>
        {showTagline && <Tagline size={size} />}
      </div>
    </div>
  );
}
