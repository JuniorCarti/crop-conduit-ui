import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
  ctaLabel?: string;
  onClick?: () => void;
};

export function BuyerTableEmptyState({ title, description, ctaLabel, onClick }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {ctaLabel ? (
        <Button className="mt-4" variant="outline" onClick={onClick}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
