import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilterChipsProps {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function FilterChips({ label, options, selected, onToggle }: FilterChipsProps) {
  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p> : null}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Button
              key={option}
              type="button"
              variant={active ? "default" : "secondary"}
              className={cn(
                "rounded-full px-4 text-xs font-semibold",
                active ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-muted",
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
