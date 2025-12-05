/**
 * Chat Service - Enhanced with Presence and Typing Indicators
 * Handles real-time messaging and negotiations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Chat, ChatMessage } from "../models/types";
import { setUserOnline, subscribeToUserPresence } from "./PresenceService";

const CHATS_COLLECTION = "chats";
const MESSAGES_COLLECTION = "messages";

const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

/**
 * Generate chat ID from user IDs (sorted for consistency)
 */
export function generateChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}

/**
 * Get or create a chat between two users
 */
export async function getOrCreateChat(
  userId1: string,
  userId2: string,
  listingId?: string,
  orderId?: string
): Promise<Chat> {
  try {
    const chatId = generateChatId(userId1, userId2);
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const data = chatSnap.data();
      return {
        id: chatSnap.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              createdAt: convertTimestamp(data.lastMessage.createdAt),
            }
          : undefined,
      } as Chat;
    }

    // Create new chat
    const newChat: any = {
      participants: [userId1, userId2].sort(),
      listingId,
      orderId,
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, CHATS_COLLECTION), {
      ...newChat,
      id: chatId,
    });

    return {
      id: chatId,
      ...newChat,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Chat;
  } catch (error) {
    console.error("Error getting/creating chat:", error);
    throw error;
  }
}

/**
 * Send a message in a chat
 */
export async function sendMessage(
  chatId: string,
  message: Omit<ChatMessage, "id" | "createdAt">
): Promise<string> {
  try {
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);
    
    const messageData: any = {
      ...message,
      readBy: {
        [message.senderId]: Timestamp.now(),
      },
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(messagesRef, messageData);

    // Update chat's last message and unread count
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    const unreadCount: Record<string, number> = {};
    message.receiverIds.forEach((receiverId) => {
      if (receiverId !== message.senderId) {
        unreadCount[receiverId] = (unreadCount[receiverId] || 0) + 1;
      }
    });

    await updateDoc(chatRef, {
      lastMessage: {
        text: message.text,
        senderId: message.senderId,
        createdAt: serverTimestamp(),
      },
      unreadCount,
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Get messages for a chat
 */
export async function getChatMessages(
  chatId: string,
  limitCount: number = 50
): Promise<ChatMessage[]> {
  try {
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);
    const q = query(messagesRef, orderBy("createdAt", "desc"), limit(limitCount));

    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        offer: data.offer
          ? {
              ...data.offer,
              expiresAt: data.offer.expiresAt
                ? convertTimestamp(data.offer.expiresAt)
                : undefined,
            }
          : undefined,
        readBy: data.readBy || {},
      } as ChatMessage);
    });

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error getting chat messages:", error);
    throw error;
  }
}

/**
 * Subscribe to chat messages with real-time updates
 */
export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  try {
    const messagesRef = collection(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION);
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            offer: data.offer
              ? {
                  ...data.offer,
                  expiresAt: data.offer.expiresAt
                    ? convertTimestamp(data.offer.expiresAt)
                    : undefined,
                }
              : undefined,
            readBy: data.readBy || {},
          } as ChatMessage);
        });
        callback(messages);
      },
      (error) => {
        console.error("Error subscribing to messages:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up message subscription:", error);
    return () => {};
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  chatId: string,
  userId: string,
  messageIds?: string[]
): Promise<void> {
  try {
    if (messageIds && messageIds.length > 0) {
      // Mark specific messages
      const batch = messageIds.map((messageId) => {
        const messageRef = doc(
          db,
          CHATS_COLLECTION,
          chatId,
          MESSAGES_COLLECTION,
          messageId
        );
        return updateDoc(messageRef, {
          [`readBy.${userId}`]: serverTimestamp(),
        });
      });
      await Promise.all(batch);
    } else {
      // Mark all unread messages in chat
      const messages = await getChatMessages(chatId, 100);
      const unreadMessages = messages.filter(
        (msg) => !msg.readBy?.[userId] && msg.senderId !== userId
      );

      const batch = unreadMessages.map((msg) => {
        const messageRef = doc(
          db,
          CHATS_COLLECTION,
          chatId,
          MESSAGES_COLLECTION,
          msg.id!
        );
        return updateDoc(messageRef, {
          [`readBy.${userId}`]: serverTimestamp(),
        });
      });

      if (batch.length > 0) {
        await Promise.all(batch);
      }
    }

    // Reset unread count for user
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    throw error;
  }
}

/**
 * Get user's chats
 */
export async function getUserChats(userId: string): Promise<Chat[]> {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const chats: Chat[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        ...data,
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              createdAt: convertTimestamp(data.lastMessage.createdAt),
            }
          : undefined,
      } as Chat);
    });

    return chats;
  } catch (error) {
    console.error("Error getting user chats:", error);
    throw error;
  }
}

/**
 * Subscribe to user's chats with real-time updates
 */
export function subscribeToUserChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  try {
    const q = query(
      collection(db, CHATS_COLLECTION),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const chats: Chat[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chats.push({
            id: doc.id,
            ...data,
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  createdAt: convertTimestamp(data.lastMessage.createdAt),
                }
              : undefined,
          } as Chat);
        });
        callback(chats);
      },
      (error) => {
        console.error("Error subscribing to chats:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up chat subscription:", error);
    return () => {};
  }
}

/**
 * Accept or decline an offer in a message
 */
export async function respondToOffer(
  chatId: string,
  messageId: string,
  accept: boolean
): Promise<void> {
  try {
    const messageRef = doc(db, CHATS_COLLECTION, chatId, MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      "offer.status": accept ? "accepted" : "declined",
    });
  } catch (error) {
    console.error("Error responding to offer:", error);
    throw error;
  }
}

/**
 * Set typing indicator (optional feature)
 */
export async function setTypingIndicator(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  try {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    await updateDoc(chatRef, {
      [`typing.${userId}`]: isTyping ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error("Error setting typing indicator:", error);
  }
}

/**
 * Subscribe to typing indicators
 */
export function subscribeToTypingIndicator(
  chatId: string,
  callback: (typingUsers: string[]) => void
): () => void {
  try {
    const chatRef = doc(db, CHATS_COLLECTION, chatId);
    
    return onSnapshot(
      chatRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const typing = data.typing || {};
          const typingUsers = Object.keys(typing).filter(
            (userId) => typing[userId] !== null
          );
          callback(typingUsers);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error("Error subscribing to typing indicator:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error setting up typing subscription:", error);
    return () => {};
  }
}
