import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommunityFiltersProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function CommunityFilters({ label, options, selected, onToggle }: CommunityFiltersProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto md:flex-wrap pb-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Button
              key={option}
              type="button"
              variant={active ? "default" : "secondary"}
              className={cn(
                "rounded-full px-4 h-9 text-xs font-semibold",
                active
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-muted/70 text-foreground hover:bg-muted"
              )}
              onClick={() => onToggle(option)}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
