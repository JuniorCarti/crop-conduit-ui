import { cn } from "@/lib/utils";

type LogoVariant = "stacked" | "inline";
type LogoSize = "sm" | "md" | "lg";
type LogoTone = "light" | "dark";

type AgriSmartLogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  tone?: LogoTone;
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

const PALETTE = {
  light: {
    agri: "#0F3D2E",
    smart: "#4CAF50",
    accent: "#A5D6A7",
    iconDark: "#0F3D2E",
    iconMid: "#4CAF50",
    iconLight: "#A5D6A7",
    tagline: "#0F3D2E",
  },
  dark: {
    agri: "#FFFFFF",
    smart: "#A5D6A7",
    accent: "#A5D6A7",
    iconDark: "#FFFFFF",
    iconMid: "#A5D6A7",
    iconLight: "#4CAF50",
    tagline: "#E6F4EC",
  },
};

function BarChartLeafIcon({ size, tone }: { size: LogoSize; tone: LogoTone }) {
  const colors = PALETTE[tone];
  return (
    <div
      className={cn("flex items-center justify-center", iconSizeMap[size])}
      style={{ backgroundColor: tone === "dark" ? "rgba(255,255,255,0.08)" : "rgba(15,61,46,0.08)", borderRadius: "18%" }}
    >
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-[70%] w-[70%]">
        <rect x="8" y="34" width="10" height="22" rx="2" fill={colors.iconLight} />
        <rect x="22" y="26" width="10" height="30" rx="2" fill={colors.iconMid} />
        <rect x="36" y="18" width="10" height="38" rx="2" fill={colors.iconDark} />
        <path d="M41 18V8" stroke={colors.iconMid} strokeWidth="2.6" strokeLinecap="round" />
        <path
          d="M41 9C36 7 34 10 34 13C37 13 40 12 41 9Z"
          fill={colors.accent}
        />
        <path
          d="M41 9C46 7 48 10 48 13C45 13 42 12 41 9Z"
          fill={colors.accent}
        />
      </svg>
    </div>
  );
}

function Wordmark({ size, tone }: { size: LogoSize; tone: LogoTone }) {
  const colors = PALETTE[tone];
  return (
    <span className={cn("font-semibold leading-tight tracking-tight", titleSizeMap[size])}>
      <span style={{ color: colors.agri }}>Agri</span>
      <span style={{ color: colors.smart }}>Smart</span>
    </span>
  );
}

function Tagline({ size, tone }: { size: LogoSize; tone: LogoTone }) {
  const colors = PALETTE[tone];
  return (
    <p
      className={cn("leading-tight", taglineSizeMap[size])}
      style={{ color: colors.tagline, marginInlineStart: "4ch", opacity: tone === "dark" ? 0.9 : 0.7 }}
    >
      Farm Intelligence Platform
    </p>
  );
}

export function AgriSmartLogo({
  variant = "inline",
  size = "md",
  showTagline = true,
  tone = "light",
  className,
}: AgriSmartLogoProps) {
  if (variant === "stacked") {
    return (
      <div className={cn("flex flex-col items-start text-left", className)}>
        <BarChartLeafIcon size={size} tone={tone} />
        <p className="mt-2"><Wordmark size={size} tone={tone} /></p>
        {showTagline && <Tagline size={size} tone={tone} />}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BarChartLeafIcon size={size} tone={tone} />
      <div className="min-w-0">
        <p><Wordmark size={size} tone={tone} /></p>
        {showTagline && <Tagline size={size} tone={tone} />}
      </div>
    </div>
  );
}
