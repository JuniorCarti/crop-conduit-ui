import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Phone, ShieldAlert, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Conversation, Message, ContactStatus } from "@/types/dm";
import { MessageBubble } from "@/components/community/MessageBubble";
import { ContactRequestBanner } from "@/components/community/ContactRequestBanner";
import { CallActionBar } from "@/components/community/CallActionBar";

interface ChatWindowProps {
  conversation: Conversation | null;
  currentUserId: string;
  messages: Message[];
  loading: boolean;
  contactStatus: ContactStatus;
  isBlocked: boolean;
  callPhone?: string | null;
  canRespond: boolean;
  isRequester: boolean;
  onRequestContact: () => void;
  onAcceptContact: () => void;
  onRejectContact: () => void;
  onSendMessage: (text: string) => Promise<void> | void;
}

export function ChatWindow({
  conversation,
  currentUserId,
  messages,
  loading,
  contactStatus,
  isBlocked,
  callPhone,
  canRespond,
  isRequester,
  onRequestContact,
  onAcceptContact,
  onRejectContact,
  onSendMessage,
}: ChatWindowProps) {
  const [text, setText] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sortedMessages.length]);

  const handleSend = async () => {
    if (!text.trim() || cooldown) return;
    setCooldown(true);
    try {
      await onSendMessage(text.trim());
      setText("");
    } finally {
      setTimeout(() => setCooldown(false), 700);
    }
  };

  const messagingDisabled = contactStatus.status !== "accepted" || isBlocked;

  return (
    <Card className="flex min-h-[70vh] flex-col overflow-hidden border-border/60 bg-card/90 shadow-sm">
      <div className="border-b border-border/60 bg-background/80 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Community Messages</p>
            <p className="text-xs text-muted-foreground">
              {conversation ? `Conversation ${conversation.conversationId.slice(0, 10)}...` : "Select a conversation"}
            </p>
          </div>
          {contactStatus.canCall ? (
            callPhone ? (
              <div className="hidden gap-2 sm:flex">
                <Button size="sm" onClick={() => window.location.href = `tel:${callPhone}`} className="h-9">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://wa.me/${callPhone.startsWith("+") ? callPhone.slice(1) : callPhone}`, "_blank", "noopener,noreferrer")}
                  className="h-9"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            ) : (
              <p className="hidden text-xs text-amber-700 sm:block">Add a verified phone number to call.</p>
            )
          ) : null}
        </div>
      </div>

      <div className="space-y-3 px-5 pt-4">
        <ContactRequestBanner
          status={contactStatus.status}
          canCall={contactStatus.canCall}
          isRequester={isRequester}
          canRespond={canRespond}
          onRequest={onRequestContact}
          onAccept={onAcceptContact}
          onReject={onRejectContact}
          disabled={loading}
        />
        <CallActionBar canCall={contactStatus.canCall} phone={callPhone} disabled={loading} />
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading messages...</div>
          ) : sortedMessages.length ? (
            sortedMessages.map((message) => (
              <MessageBubble
                key={message.messageId}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No messages yet. Start by requesting contact consent.
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 bg-background/90 p-4">
        {messagingDisabled ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            {isBlocked ? "Messaging is disabled because this user is blocked." : "Messaging is disabled until consent is accepted."}
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your message..."
              className="min-h-[48px] resize-none rounded-2xl border-border/60 bg-muted/30"
            />
            <Button
              type="button"
              className={cn("h-11 px-4", cooldown && "opacity-70")}
              onClick={handleSend}
              disabled={!text.trim() || cooldown}
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
