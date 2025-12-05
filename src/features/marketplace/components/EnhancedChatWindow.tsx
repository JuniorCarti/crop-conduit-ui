/**
 * Enhanced Chat Window Component
 * Real-time chat with presence indicators and typing indicators
 */

import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, DollarSign, Check, X, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat, useSendMessage } from "../hooks/useMarketplace";
import { markMessagesAsRead, respondToOffer, setTypingIndicator, subscribeToTypingIndicator } from "../services/ChatService";
import { subscribeToUserPresence } from "../services/PresenceService";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import type { ChatMessage } from "../models/types";
import { formatKsh } from "@/lib/currency";

interface EnhancedChatWindowProps {
  chatId: string;
  otherUserId: string;
  otherUserName?: string;
}

export function EnhancedChatWindow({ chatId, otherUserId, otherUserName }: EnhancedChatWindowProps) {
  const { currentUser } = useAuth();
  const { messages, isLoading } = useChat(chatId);
  const sendMessage = useSendMessage();
  const [messageText, setMessageText] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to other user's presence
  useEffect(() => {
    if (!otherUserId) return;
    const unsubscribe = subscribeToUserPresence(otherUserId, (isOnline) => {
      setIsOtherUserOnline(isOnline);
    });
    return () => unsubscribe();
  }, [otherUserId]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToTypingIndicator(chatId, (users) => {
      setTypingUsers(users.filter((uid) => uid !== currentUser?.uid));
    });
    return () => unsubscribe();
  }, [chatId, currentUser?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (currentUser?.uid && chatId) {
      markMessagesAsRead(chatId, currentUser.uid);
    }
  }, [messages, currentUser?.uid, chatId]);

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (chatId && currentUser?.uid) {
      setTypingIndicator(chatId, currentUser.uid, isTyping);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUser?.uid) return;

    try {
      await sendMessage.mutateAsync({
        chatId,
        message: {
          chatId,
          senderId: currentUser.uid,
          receiverIds: [otherUserId],
          text: messageText,
        },
      });
      setMessageText("");
      handleTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || !offerQuantity || !currentUser?.uid) return;

    try {
      await sendMessage.mutateAsync({
        chatId,
        message: {
          chatId,
          senderId: currentUser.uid,
          receiverIds: [otherUserId],
          text: `I'm offering ${formatKsh(Number(offerPrice))} for ${offerQuantity} units`,
          offer: {
            price: Number(offerPrice),
            quantity: Number(offerQuantity),
            status: "pending",
          },
        },
      });
      setShowOfferForm(false);
      setOfferPrice("");
      setOfferQuantity("");
    } catch (error) {
      console.error("Error sending offer:", error);
    }
  };

  const handleRespondToOffer = async (messageId: string, accept: boolean) => {
    try {
      await respondToOffer(chatId, messageId, accept);
    } catch (error) {
      console.error("Error responding to offer:", error);
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Chat with {otherUserName || "User"}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOtherUserOnline ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-xs text-muted-foreground">
              {isOtherUserOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        {typingUsers.length > 0 && (
          <p className="text-xs text-muted-foreground italic">
            {otherUserName || "User"} is typing...
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4" ref={scrollRef}>
            {messages.map((message) => {
              const isOwn = message.senderId === currentUser?.uid;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    {message.offer && (
                      <div className="mt-2 p-2 bg-background/20 rounded">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold">Offer</p>
                            <p className="text-sm">
                              {formatKsh(message.offer.price)} × {message.offer.quantity}
                            </p>
                          </div>
                          {!isOwn && message.offer.status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleRespondToOffer(message.id!, true)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => handleRespondToOffer(message.id!, false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {message.offer.status !== "pending" && (
                            <Badge variant="outline" className="text-xs">
                              {message.offer.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {format(new Date(message.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {showOfferForm && (
          <div className="border-t p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
              <Input
                placeholder="Quantity"
                type="number"
                value={offerQuantity}
                onChange={(e) => setOfferQuantity(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSendOffer}>
                Send Offer
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowOfferForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                  handleTyping(false);
                }
              }}
              rows={2}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setShowOfferForm(!showOfferForm)}
                title="Make an offer"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} disabled={!messageText.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
