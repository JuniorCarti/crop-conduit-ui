export type ConversationUser = {
  uid: string;
  displayName?: string;
};

export type Conversation = {
  conversationId: string;
  userIds?: string[];
  otherUser?: ConversationUser;
  lastMessage: string;
  updatedAt: string;
  canCall?: boolean;
  contactStatus?: "none" | "pending" | "accepted" | "rejected";
};

export type Message = {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type ContactStatus = {
  status: "none" | "pending" | "accepted" | "rejected";
  canCall: boolean;
  requestId?: string;
  fromUid?: string;
  toUid?: string;
};

export type ContactRequest = {
  pairKey: string;
  requestId: string;
  fromUid: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type PagedResult<T> = {
  items: T[];
  nextCursor: string | null;
};
