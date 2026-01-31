import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Conversation, Message, ContactStatus, ContactRequest } from "@/types/dm";
import * as dmService from "@/services/dmService";

export function getOtherUidFromConversation(
  conversation: Pick<Conversation, "conversationId" | "userIds">,
  currentUid: string | null | undefined,
) {
  if (conversation.userIds?.length && currentUid) {
    return conversation.userIds.find((id) => id !== currentUid) || null;
  }
  if (!currentUid) return null;
  const parts = conversation.conversationId.split("#");
  return parts.find((id) => id !== currentUid) || null;
}

export function useConversations(currentUserId?: string) {
  return useQuery({
    queryKey: ["dm", "conversations", currentUserId],
    queryFn: () => dmService.listConversations(currentUserId),
    staleTime: 10_000,
    refetchInterval: 15_000,
    onError: (error: any) => {
      toast.error(error?.message || "Unable to load conversations");
    },
  });
}

export function useConversationMessages(conversationId?: string, enabled = true) {
  return useQuery({
    queryKey: ["dm", "messages", conversationId],
    queryFn: () => dmService.listMessages(conversationId || ""),
    enabled: Boolean(conversationId) && enabled,
    staleTime: 2_000,
    refetchInterval: 4_000,
    onError: (error: any) => {
      toast.error(error?.message || "Unable to load messages");
    },
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => dmService.sendMessage({ conversationId, text }),
    onSuccess: (message) => {
      queryClient.setQueryData(["dm", "messages", conversationId], (old: any) => {
        if (!old?.items) {
          return { items: [message], nextCursor: null };
        }
        const exists = old.items.some((item: Message) => item.messageId === message.messageId);
        if (exists) return old;
        return { ...old, items: [message, ...old.items] };
      });
      queryClient.invalidateQueries({ queryKey: ["dm", "conversations"] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to send message");
    },
  });
}

export function useContactStatus(otherUid?: string) {
  return useQuery({
    queryKey: ["dm", "contact-status", otherUid],
    queryFn: () => dmService.getContactStatus(otherUid || ""),
    enabled: Boolean(otherUid),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useRequestContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toUid: string) => dmService.requestContact(toUid),
    onSuccess: (request: ContactRequest) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "contact-status", request.toUid] });
      toast.success("Contact request sent");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to send request");
    },
  });
}

export function useAcceptContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { otherUid: string; requestId: string }) => dmService.acceptContact(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "contact-status", variables.otherUid] });
      toast.success("Contact request accepted");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to accept request");
    },
  });
}

export function useRejectContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { otherUid: string; requestId: string }) => dmService.rejectContact(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "contact-status", variables.otherUid] });
      toast.success("Contact request declined");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to decline request");
    },
  });
}

export function useBlockActions() {
  const queryClient = useQueryClient();
  const block = useMutation({
    mutationFn: (blockedUid: string) => dmService.blockUser(blockedUid),
    onSuccess: (_data, blockedUid) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "contact-status", blockedUid] });
      toast.success("User blocked");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to block user");
    },
  });

  const unblock = useMutation({
    mutationFn: (blockedUid: string) => dmService.unblockUser(blockedUid),
    onSuccess: (_data, blockedUid) => {
      queryClient.invalidateQueries({ queryKey: ["dm", "contact-status", blockedUid] });
      toast.success("User unblocked");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to unblock user");
    },
  });

  return { block, unblock };
}

export function contactStatusLabel(status?: ContactStatus["status"]) {
  switch (status) {
    case "accepted":
      return "Connected";
    case "pending":
      return "Pending approval";
    case "rejected":
      return "Request declined";
    default:
      return "Not connected";
  }
}
