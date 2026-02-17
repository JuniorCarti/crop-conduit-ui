import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function BuyerProfileEmptyState({ title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <p className="text-base font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {ctaLabel && onCta ? (
        <Button className="mt-4" variant="outline" onClick={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
