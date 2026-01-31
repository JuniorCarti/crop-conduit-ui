import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import type { Conversation, Message, ContactStatus, ContactRequest, PagedResult, ConversationUser } from "@/types/dm";

const API_BASE_URL = import.meta.env.VITE_COMMUNITY_API_BASE_URL;

function ensureApiBase() {
  if (!API_BASE_URL) {
    throw new Error("VITE_COMMUNITY_API_BASE_URL is not set");
  }
}

async function getFirebaseIdToken(forceRefresh = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user.getIdToken(forceRefresh);
}

function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  ensureApiBase();

  let token = "";
  try {
    token = await getFirebaseIdToken();
  } catch (error: any) {
    toast.error("Authentication not ready. Please sign in again.");
    throw error;
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  } as Record<string, string>;

  if (!headers["Content-Type"] && options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    toast.error("Session expired. Please sign in again.");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (response.status === 403) {
    toast.error("You do not have permission to perform this action.");
    throw new Error("Forbidden");
  }

  if (!response.ok) {
    let details = "Request failed";
    try {
      const data = await response.json();
      details = data?.message || details;
    } catch {
      // ignore
    }
    throw new Error(details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function mapOtherUser(raw: any): ConversationUser | undefined {
  if (raw?.otherUser?.uid) {
    return { uid: raw.otherUser.uid, displayName: raw.otherUser.displayName };
  }
  if (raw?.otherUserId) {
    return { uid: raw.otherUserId, displayName: raw.otherUserName };
  }
  return undefined;
}

function mapConversation(raw: any): Conversation {
  return {
    conversationId: raw?.conversationId || raw?.id || "",
    userIds: Array.isArray(raw?.userIds) ? raw.userIds : undefined,
    otherUser: mapOtherUser(raw),
    lastMessage: raw?.lastMessage || "",
    updatedAt: raw?.updatedAt || new Date().toISOString(),
    canCall: typeof raw?.canCall === "boolean" ? raw.canCall : undefined,
    contactStatus: raw?.contactStatus,
  };
}

function mapMessage(raw: any): Message {
  const messageKey = raw?.messageKey || raw?.messageId || raw?.id || "";
  const [createdFromKey, idFromKey] = typeof messageKey === "string" ? messageKey.split("#") : ["", ""];
  return {
    messageId: raw?.messageId || idFromKey || messageKey || "",
    conversationId: raw?.conversationId || "",
    senderId: raw?.senderId || "",
    text: raw?.text || "",
    createdAt: raw?.createdAt || createdFromKey || new Date().toISOString(),
  };
}

export async function listConversations(
  currentUserId?: string,
  cursor?: string,
): Promise<PagedResult<Conversation>> {
  const query = buildQuery({ nextToken: cursor });
  const data = await fetchWithAuth<{ items: any[]; nextToken?: string }>(`/dm/conversations${query}`);
  const items = (data.items || []).map(mapConversation).map((item) => {
    if (item.otherUser || !currentUserId || !item.userIds?.length) return item;
    const otherUid = item.userIds.find((id) => id !== currentUserId);
    if (!otherUid) return item;
    return { ...item, otherUser: { uid: otherUid } };
  });
  return { items, nextCursor: data.nextToken || null };
}

export async function startConversation(otherUid: string): Promise<Conversation> {
  const data = await fetchWithAuth<{ conversation?: any; conversationId?: string }>("/dm/conversations", {
    method: "POST",
    body: JSON.stringify({ otherUid }),
  });
  if (data.conversation) return mapConversation(data.conversation);
  return mapConversation(data);
}

export async function listMessages(
  conversationId: string,
  cursor?: string,
): Promise<PagedResult<Message>> {
  const query = buildQuery({ nextToken: cursor });
  const data = await fetchWithAuth<{ items: any[]; nextToken?: string }>(
    `/dm/conversations/${conversationId}/messages${query}`,
  );
  return {
    items: (data.items || []).map(mapMessage),
    nextCursor: data.nextToken || null,
  };
}

export async function sendMessage(params: { conversationId: string; text: string }): Promise<Message> {
  const data = await fetchWithAuth<{ message: any }>(
    `/dm/conversations/${params.conversationId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ text: params.text }),
    },
  );
  return mapMessage(data.message);
}

export async function requestContact(toUid: string): Promise<ContactRequest> {
  const data = await fetchWithAuth<{ request: any }>("/dm/contact-requests", {
    method: "POST",
    body: JSON.stringify({ toUid }),
  });
  return data.request as ContactRequest;
}

export async function acceptContact(params: { otherUid: string; requestId: string }): Promise<ContactStatus> {
  const data = await fetchWithAuth<{ request: any; canCall: boolean }>("/dm/contact-requests/accept", {
    method: "PUT",
    body: JSON.stringify({ otherUid: params.otherUid, requestId: params.requestId }),
  });
  return {
    status: data.request?.status || "accepted",
    canCall: !!data.canCall,
    requestId: data.request?.requestId,
    fromUid: data.request?.fromUid,
    toUid: data.request?.toUid,
  };
}

export async function rejectContact(params: { otherUid: string; requestId: string }): Promise<ContactStatus> {
  const data = await fetchWithAuth<{ request: any; canCall: boolean }>("/dm/contact-requests/reject", {
    method: "PUT",
    body: JSON.stringify({ otherUid: params.otherUid, requestId: params.requestId }),
  });
  return {
    status: data.request?.status || "rejected",
    canCall: !!data.canCall,
    requestId: data.request?.requestId,
    fromUid: data.request?.fromUid,
    toUid: data.request?.toUid,
  };
}

export async function getContactStatus(otherUid: string): Promise<ContactStatus> {
  const data = await fetchWithAuth<{ status: ContactStatus["status"]; canCall: boolean }>(
    `/dm/contact-status/${otherUid}`,
  );
  return {
    status: data.status,
    canCall: !!data.canCall,
  };
}

export async function blockUser(blockedUid: string): Promise<void> {
  await fetchWithAuth("/dm/blocks", {
    method: "POST",
    body: JSON.stringify({ blockedUid }),
  });
}

export async function unblockUser(blockedUid: string): Promise<void> {
  await fetchWithAuth(`/dm/blocks/${blockedUid}`, {
    method: "DELETE",
  });
}
