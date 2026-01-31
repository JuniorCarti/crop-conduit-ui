import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/dm";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return format(date, "MMM d, h:mm a");
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isOwn
            ? "bg-emerald-600 text-white rounded-br-md"
            : "bg-card text-foreground rounded-bl-md border border-border/60",
        )}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <p className={cn("mt-2 text-[11px]", isOwn ? "text-emerald-50/80" : "text-muted-foreground")}>
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
