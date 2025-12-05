/**
 * Marketplace React Hooks
 * Provides data fetching and mutations for marketplace operations
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as ListingService from "../services/ListingService";
import * as OrderService from "../services/OrderService";
import * as PaymentService from "../services/PaymentService";
import * as ChatService from "../services/ChatService";
import * as RatingService from "../services/RatingService";
import * as DisputeService from "../services/DisputeService";
import type {
  Listing,
  ListingFilters,
  ListingSortBy,
  Order,
  OrderStatus,
  Chat,
  ChatMessage,
  Rating,
  Dispute,
  MpesaSTKPushRequest,
} from "../models/types";

// ============================================================================
// LISTINGS HOOKS
// ============================================================================

export function useListings(filters?: ListingFilters, sortBy?: ListingSortBy) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = ListingService.subscribeToListings(filters || {}, (data) => {
      setListings(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [JSON.stringify(filters), sortBy]);

  return { listings, isLoading };
}

export function useSearchListings(
  filters?: ListingFilters,
  sortBy: ListingSortBy = "newest"
) {
  return useQuery({
    queryKey: ["listings", filters, sortBy],
    queryFn: () => ListingService.searchListings(filters, sortBy),
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (listing: Omit<Listing, "id" | "createdAt" | "updatedAt" | "sellerId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return ListingService.createListing({
        ...listing,
        sellerId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create listing");
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Listing> }) => {
      return ListingService.updateListing(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update listing");
    },
  });
}

export function useListing(listingId: string | null) {
  return useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => {
      if (!listingId) throw new Error("Listing ID required");
      return ListingService.getListing(listingId);
    },
    enabled: !!listingId,
  });
}

// ============================================================================
// ORDERS HOOKS
// ============================================================================

export function useUserOrders(role: "buyer" | "seller", status?: OrderStatus) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = OrderService.subscribeToUserOrders(
      currentUser.uid,
      role,
      (data) => {
        setOrders(data);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, role]);

  return { orders, isLoading };
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Order ID required");
      return OrderService.getOrder(orderId);
    },
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status" | "buyerId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return OrderService.createOrder({
        ...order,
        buyerId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      additionalData,
    }: {
      orderId: string;
      status: OrderStatus;
      additionalData?: Partial<Order>;
    }) => {
      return OrderService.updateOrderStatus(orderId, status, additionalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order");
    },
  });
}

// ============================================================================
// PAYMENT HOOKS
// ============================================================================

export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MpesaSTKPushRequest) => {
      return PaymentService.initiateMpesaPayment(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to initiate payment");
    },
  });
}

export function useOrderTransactions(orderId: string | null) {
  return useQuery({
    queryKey: ["transactions", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Order ID required");
      return PaymentService.getOrderTransactions(orderId);
    },
    enabled: !!orderId,
  });
}

// ============================================================================
// CHAT HOOKS
// ============================================================================

export function useChat(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chatId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = ChatService.subscribeToChatMessages(chatId, (data) => {
      setMessages(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  return { messages, isLoading };
}

export function useUserChats() {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    ChatService.getUserChats(currentUser.uid).then((data) => {
      setChats(data);
      setIsLoading(false);
    });
  }, [currentUser?.uid]);

  return { chats, isLoading };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      message,
    }: {
      chatId: string;
      message: Omit<ChatMessage, "id" | "createdAt">;
    }) => {
      return ChatService.sendMessage(chatId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

// ============================================================================
// RATING HOOKS
// ============================================================================

export function useCreateRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rating: Omit<Rating, "id" | "createdAt">) => {
      return RatingService.createRating(rating);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings"] });
      toast.success("Rating submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit rating");
    },
  });
}

// ============================================================================
// DISPUTE HOOKS
// ============================================================================

export function useCreateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dispute: Omit<Dispute, "id" | "createdAt" | "updatedAt" | "status">) => {
      return DisputeService.createDispute(dispute);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      toast.success("Dispute created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create dispute");
    },
  });
}

export function useOrderDisputes(orderId: string | null) {
  return useQuery({
    queryKey: ["disputes", orderId],
    queryFn: () => {
      if (!orderId) throw new Error("Order ID required");
      return DisputeService.getOrderDisputes(orderId);
    },
    enabled: !!orderId,
  });
}
