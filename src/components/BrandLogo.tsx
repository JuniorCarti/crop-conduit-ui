import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

type BrandLogoVariant = "icon" | "full";
type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
};

// Compatibility wrapper for existing call sites.
export function BrandLogo({ variant = "full", size = "md", className }: BrandLogoProps) {
  if (variant === "icon") {
    return <AgriSmartLogo variant="inline" size={size} showTagline={false} className={className} />;
  }
  return <AgriSmartLogo variant="stacked" size={size} showTagline className={className} />;
}
