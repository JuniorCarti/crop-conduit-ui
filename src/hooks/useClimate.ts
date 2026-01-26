/**
 * React Query hooks for Climate feature
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAlertSubscription,
  getFarms,
  getUserProfile,
  createFarm,
  subscribeToFarms,
  subscribeToRecentAlerts,
  updateAlertSubscription,
} from "@/services/firestore-climate";
import type { AlertItem, AlertSubscription, FarmLocation, UserProfile } from "@/types/climate";

export function useUserProfile() {
  const { currentUser } = useAuth();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile", currentUser?.uid],
    queryFn: () => (currentUser?.uid ? getUserProfile(currentUser.uid) : Promise.resolve(null)),
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 10,
  });
}

export function useFarms() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const uid = currentUser?.uid || null;
  const farmsQuery = useQuery<FarmLocation[]>({
    queryKey: ["farms", uid],
    queryFn: () => (uid ? getFarms(uid) : Promise.resolve([])),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = subscribeToFarms(uid, (data) => {
      queryClient.setQueryData(["farms", uid], data);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, uid]);

  const isLoading = !!uid && farmsQuery.isLoading;
  return { farms: uid ? farmsQuery.data ?? [] : [], isLoading };
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  return useMutation({
    mutationFn: async (payload: Omit<FarmLocation, "id" | "createdAt" | "uid">) => {
      if (!uid) {
        throw new Error("User not authenticated");
      }
      return createFarm({ ...payload, uid });
    },
    onSuccess: () => {
      if (uid) {
        queryClient.invalidateQueries({ queryKey: ["farms", uid] });
      }
    },
  });
}

export function useRecentAlerts(limitCount: number = 3) {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToRecentAlerts(currentUser.uid, (data) => {
      setAlerts(data);
      setIsLoading(false);
    }, limitCount);

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid, limitCount]);

  return { alerts, isLoading };
}

export function useAlertSubscription() {
  const { currentUser } = useAuth();
  return useQuery<AlertSubscription | null>({
    queryKey: ["alertSubscription", currentUser?.uid],
    queryFn: () => (currentUser?.uid ? getAlertSubscription(currentUser.uid) : Promise.resolve(null)),
    enabled: !!currentUser?.uid,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateAlertSubscription() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      farmId: string;
      channels: Array<"inApp" | "sms">;
      frost: boolean;
      rain: boolean;
    }) => {
      if (!currentUser?.uid) {
        throw new Error("User not authenticated");
      }
      return updateAlertSubscription({ uid: currentUser.uid, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertSubscription"] });
    },
  });
}
