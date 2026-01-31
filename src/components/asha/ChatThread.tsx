import type { AshaMessage } from "@/types/asha";
import { ChatBubble } from "@/components/asha/ChatBubble";
import { TypingIndicator } from "@/components/asha/TypingIndicator";

export function ChatThread({
  messages,
  isLoading,
}: {
  messages: AshaMessage[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Start a conversation with Asha. Ask about weather, marketplace prices, or your farm.
        </div>
      ) : (
        messages.map((message) => <ChatBubble key={message.id} message={message} />)
      )}
      {isLoading && (
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <TypingIndicator />
        </div>
      )}
    </div>
  );
}
