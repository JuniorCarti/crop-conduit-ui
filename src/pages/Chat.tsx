import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type { ContactRequest, ContactStatus, Conversation } from "@/types/dm";
import {
  getOtherUidFromConversation,
  useAcceptContact,
  useContactStatus,
  useConversationMessages,
  useConversations,
  useRejectContact,
  useRequestContact,
  useSendMessage,
  useBlockActions,
} from "@/hooks/useDirectMessages";
import { ChatWindow } from "@/components/community/ChatWindow";

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [localRequest, setLocalRequest] = useState<ContactRequest | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const { data: convoData, isLoading: loadingConvos } = useConversations(currentUser?.uid);
  const conversation = useMemo<Conversation | null>(() => {
    return convoData?.items.find((item) => item.conversationId === conversationId) || null;
  }, [convoData, conversationId]);

  const otherUid = useMemo(() => {
    if (!conversation && conversationId && currentUser?.uid) {
      const parts = conversationId.split("#");
      return parts.find((id) => id !== currentUser.uid) || null;
    }
    if (!conversation) return null;
    return getOtherUidFromConversation(conversation, currentUser?.uid) || null;
  }, [conversation, conversationId, currentUser?.uid]);

  const incomingRequestId = (location.state as { requestId?: string } | null)?.requestId;
  const incomingRequestOtherUid = (location.state as { otherUid?: string } | null)?.otherUid;
  const incomingPhone = (location.state as { phone?: string } | null)?.phone;

  const { data: messageData, isLoading: loadingMessages } = useConversationMessages(conversationId);
  const messages = messageData?.items || [];

  const { data: contactStatusData } = useContactStatus(otherUid || "");
  const contactStatus: ContactStatus = contactStatusData || { status: "none", canCall: false };

  const requestContact = useRequestContact();
  const acceptContact = useAcceptContact();
  const rejectContact = useRejectContact();
  const { block, unblock } = useBlockActions();

  const activeRequestId = localRequest?.requestId || incomingRequestId;
  const activeRequestOtherUid = localRequest?.toUid || incomingRequestOtherUid || otherUid || "";
  const isRequester = Boolean(localRequest?.requestId);
  const canRespond = contactStatus.status === "pending" && !isRequester;

  const sendMessageMutation = useSendMessage(conversationId || "");

  const handleRequestContact = async () => {
    if (!otherUid) return;
    const request = await requestContact.mutateAsync(otherUid);
    setLocalRequest(request);
  };

  const handleAccept = async () => {
    if (!activeRequestOtherUid || !activeRequestId) {
      toast.error("Contact request not found.");
      return;
    }
    await acceptContact.mutateAsync({ otherUid: activeRequestOtherUid, requestId: activeRequestId });
  };

  const handleReject = async () => {
    if (!activeRequestOtherUid || !activeRequestId) {
      toast.error("Contact request not found.");
      return;
    }
    await rejectContact.mutateAsync({ otherUid: activeRequestOtherUid, requestId: activeRequestId });
  };

  const handleSendMessage = async (text: string) => {
    if (!conversationId || !otherUid) return;
    try {
      await sendMessageMutation.mutateAsync(text);
    } catch (error: any) {
      if (String(error?.message || "").toLowerCase().includes("blocked")) {
        setIsBlocked(true);
      }
    }
  };

  const handleToggleBlock = async () => {
    if (!otherUid) return;
    if (isBlocked) {
      await unblock.mutateAsync(otherUid);
      setIsBlocked(false);
      return;
    }
    await block.mutateAsync(otherUid);
    setIsBlocked(true);
  };

  if (loadingConvos) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!conversationId || !conversation) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-10 pt-6">
        <Button variant="ghost" className="w-fit gap-2" onClick={() => navigate("/community/inbox")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Inbox
        </Button>
        <Card className="border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Conversation not found. Return to your inbox.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => navigate("/community/inbox")}>
          <ArrowLeft className="h-4 w-4" />
          Inbox
        </Button>
        <div className="flex items-center gap-2">
          {!otherUid ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Unknown participant
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleBlock}
              className="text-xs"
              disabled={block.isPending || unblock.isPending}
            >
              {isBlocked ? "Unblock" : "Block"}
            </Button>
          )}
        </div>
      </div>

      <ChatWindow
        conversation={conversation}
        currentUserId={currentUser?.uid || ""}
        messages={messages}
        loading={loadingMessages}
        contactStatus={contactStatus}
        isBlocked={isBlocked}
        callPhone={incomingPhone || null}
        canRespond={canRespond}
        isRequester={isRequester}
        onRequestContact={handleRequestContact}
        onAcceptContact={handleAccept}
        onRejectContact={handleReject}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
