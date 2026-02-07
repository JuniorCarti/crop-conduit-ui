import { cn } from "@/lib/utils";

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

function SproutIcon({ size }: { size: LogoSize }) {
  return (
    <div className={cn("rounded-full bg-primary/10 flex items-center justify-center", iconSizeMap[size])}>
      <svg viewBox="0 0 64 64" aria-hidden="true" className="h-[68%] w-[68%]">
        <path
          d="M31 52V34"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
          className="text-primary"
        />
        <path
          d="M31 37c-9 0-16-7-16-16 9 0 16 7 16 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinejoin="round"
          className="text-primary"
        />
        <path
          d="M33 33c0-9 7-16 16-16 0 9-7 16-16 16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinejoin="round"
          className="text-primary"
        />
        <path
          d="M20 52h24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.8"
          strokeLinecap="round"
          className="text-primary/80"
        />
      </svg>
    </div>
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
      <div className={cn("flex flex-col items-center text-center", className)}>
        <SproutIcon size={size} />
        <p className={cn("mt-2 font-semibold leading-tight text-foreground", titleSizeMap[size])}>AgriSmart</p>
        {showTagline && (
          <p className={cn("leading-tight text-muted-foreground", taglineSizeMap[size])}>Farm Intelligence</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SproutIcon size={size} />
      <div className="min-w-0">
        <p className={cn("font-semibold leading-tight text-foreground", titleSizeMap[size])}>AgriSmart</p>
        {showTagline && (
          <p className={cn("leading-tight text-muted-foreground", taglineSizeMap[size])}>Farm Intelligence</p>
        )}
      </div>
    </div>
  );
}

