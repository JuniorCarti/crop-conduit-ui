import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MessageSquareText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationList } from "@/components/community/ConversationList";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/hooks/useDirectMessages";
import { startConversation } from "@/services/dmService";

export default function Inbox() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useConversations(currentUser?.uid);
  const createMutation = useMutation({
    mutationFn: (otherUid: string) => startConversation(otherUid),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "conversations"] });
      navigate(`/community/chat/${conversation.conversationId}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to start conversation");
    },
  });

  const conversations = useMemo(() => data?.items || [], [data]);

  const handleNewChat = () => {
    if (typeof window === "undefined") return;
    const input = window.prompt("Enter the farmer UID to start a chat", "");
    const otherUid = input?.trim();
    if (!otherUid) return;
    if (otherUid.length <= 20) {
      toast.error("Please select a farmer from a post or profile (names aren’t valid IDs).");
      return;
    }
    if (otherUid === currentUser?.uid) {
      toast.error("You cannot chat with yourself.");
      return;
    }
    createMutation.mutate(otherUid);
  };

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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleNewChat}
            disabled={createMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          currentUserId={currentUser?.uid || null}
          onSelect={(conversation) => navigate(`/community/chat/${conversation.conversationId}`)}
        />
      )}
    </div>
  );
}
