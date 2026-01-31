import { cn } from "@/lib/utils";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className={cn("h-2 w-2 rounded-full bg-muted-foreground/60", "animate-bounce")} />
        <span className={cn("h-2 w-2 rounded-full bg-muted-foreground/60", "animate-bounce", "[animation-delay:120ms]")} />
        <span className={cn("h-2 w-2 rounded-full bg-muted-foreground/60", "animate-bounce", "[animation-delay:240ms]")} />
      </div>
      <span className="text-xs text-muted-foreground">Asha is typing...</span>
    </div>
  );
}
