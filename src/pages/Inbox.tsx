import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquareText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationList } from "@/components/community/ConversationList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import { useConversations } from "@/hooks/useDirectMessages";

export default function Inbox() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, isLoading } = useConversations(currentUser?.uid);
  const conversations = useMemo(() => data?.items || [], [data]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/80">Community</p>
          <h1 className="text-2xl font-semibold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground">
            Secure direct messages with consent-based calling.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/community")}
          className="gap-2"
        >
          <MessageSquareText className="h-4 w-4" />
          Back to Community
        </Button>
      </div>

      <Card className="border-border/60 bg-card/80 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Your conversations</p>
          <p className="text-xs text-muted-foreground">
            Tap “Message Farmer” from a post or profile to start chatting.
          </p>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : conversations.length ? (
        <ConversationList
          conversations={conversations}
          currentUserId={currentUser?.uid || null}
          onSelect={(conversation) => navigate(`/community/chat/${conversation.conversationId}`)}
        />
      ) : (
        <AlertCard
          type="info"
          title="No conversations yet"
          message="Message a farmer from the community feed to start the first chat."
        />
      )}
    </div>
  );
}
