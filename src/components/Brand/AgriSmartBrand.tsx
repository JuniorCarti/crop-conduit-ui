import { cn } from "@/lib/utils";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

type BrandVariant = "sidebar" | "header" | "auth";
type BrandSize = "sm" | "md" | "lg";

type AgriSmartBrandProps = {
  variant?: BrandVariant;
  showText?: boolean;
  size?: BrandSize;
  className?: string;
};

export function AgriSmartBrand({
  variant = "header",
  showText = true,
  size = "md",
  className,
}: AgriSmartBrandProps) {
  const mappedVariant = variant === "header" ? "inline" : "stacked";
  return <AgriSmartLogo variant={mappedVariant} size={size} showTagline={showText} className={cn(className)} />;
}
