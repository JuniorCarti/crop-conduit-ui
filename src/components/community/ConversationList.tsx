import { formatDistanceToNowStrict } from "date-fns";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/dm";
import { getOtherUidFromConversation } from "@/hooks/useDirectMessages";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string | null;
  activeId?: string | null;
  onSelect: (conversation: Conversation) => void;
}

function initialsFromUid(uid?: string | null) {
  if (!uid) return "F";
  return uid.slice(0, 2).toUpperCase();
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function ConversationList({ conversations, currentUserId, activeId, onSelect }: ConversationListProps) {
  if (!conversations.length) {
    return (
      <Card className="border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        No conversations yet. Start by sending a request.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const otherUid = conversation.otherUser?.uid || getOtherUidFromConversation(conversation, currentUserId) || "Farmer";
        const otherName = conversation.otherUser?.displayName || `Farmer ${otherUid.slice(0, 6)}`;
        const isActive = activeId === conversation.conversationId;
        const recent = Date.now() - new Date(conversation.updatedAt).getTime() < 2 * 60 * 60 * 1000;
        return (
          <button
            key={conversation.conversationId}
            type="button"
            onClick={() => onSelect(conversation)}
            className={cn(
              "w-full text-left",
              "rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm transition",
              "hover:shadow-md hover:border-emerald-200",
              isActive && "border-emerald-400/60 bg-emerald-50/40",
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                  {initialsFromUid(otherUid)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground truncate">{otherName}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(conversation.updatedAt)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage || "Start the conversation"}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                {recent && conversation.lastMessage ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="New message" />
                ) : (
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
