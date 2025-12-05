/**
 * React Query Hooks for API Integration
 * 
 * These hooks provide a clean interface for components to fetch data.
 * When switching to real APIs, only these hooks need to be updated.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { useFieldHealth } from './useFieldHealth';
import { useNextHarvest } from './useNextHarvest';
import {
  oracleApi,
  sentinelApi,
  quartermasterApi,
  foremanApi,
  chancellorApi,
  marketplaceApi,
  communityApi,
  dashboardApi,
  type CropPrice,
  type PriceHistory,
  type RecommendedMarket,
  type FieldData,
  type NDVIHistory,
  type YieldForecast,
  type InventoryItem,
  type Recommendation,
  type IrrigationSchedule,
  type HarvestSchedule,
  type Worker,
  type DeliverySchedule,
  type CashflowData,
  type LoanOption,
  type InsuranceOption,
  type RiskAnalysis,
  type Listing,
  type Transaction,
  type ChatMessage,
  type ForumPost,
  type Event,
  type KnowledgeResource,
  type Alert,
} from '@/services/api';

// ============================================================================
// ORACLE AGENT HOOKS
// ============================================================================

export function useCropPrices() {
  return useQuery({
    queryKey: ['cropPrices'],
    queryFn: () => oracleApi.getCropPrices(),
    staleTime: 2 * 60 * 1000, // 2 minutes (real-time data)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

export function usePriceHistory(period: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return useQuery({
    queryKey: ['priceHistory', period],
    queryFn: () => oracleApi.getPriceHistory(period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRecommendedMarkets(crop?: string) {
  return useQuery({
    queryKey: ['recommendedMarkets', crop],
    queryFn: () => oracleApi.getRecommendedMarkets(crop),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function usePricePredictions(crop?: string) {
  return useQuery({
    queryKey: ['pricePredictions', crop],
    queryFn: () => oracleApi.getPricePredictions(crop),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ============================================================================
// SENTINEL AGENT HOOKS
// ============================================================================

export function useFieldData() {
  // Use real-time field health data
  const { health, isLoading } = useFieldHealth();
  
  // Transform field health to fieldData format
  const fieldData = useMemo(() => {
    return health.map((h) => ({
      id: h.fieldId,
      name: h.fieldName,
      crop: h.cropName || "Unknown",
      area: "N/A", // Could be added to field health
      ndvi: h.ndvi || 0.7,
      moisture: h.moisture || 60,
      health: h.health,
      lastUpdated: h.lastChecked instanceof Date 
        ? h.lastChecked.toISOString() 
        : new Date(h.lastChecked).toISOString(),
    }));
  }, [health]);

  return { data: fieldData, isLoading, error: null };
}

export function useNDVIHistory(fieldId?: number) {
  return useQuery({
    queryKey: ['ndviHistory', fieldId],
    queryFn: () => sentinelApi.getNDVIHistory(fieldId),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useYieldForecasts() {
  return useQuery({
    queryKey: ['yieldForecasts'],
    queryFn: () => sentinelApi.getYieldForecasts(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSoilMoisture(fieldId?: number) {
  return useQuery({
    queryKey: ['soilMoisture', fieldId],
    queryFn: () => sentinelApi.getSoilMoisture(fieldId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================================
// QUARTERMASTER AGENT HOOKS
// ============================================================================

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => quartermasterApi.getInventory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ['recommendations'],
    queryFn: () => quartermasterApi.getRecommendations(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useIrrigationSchedule() {
  return useQuery({
    queryKey: ['irrigationSchedule'],
    queryFn: () => quartermasterApi.getIrrigationSchedule(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useAddInventoryItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => 
      quartermasterApi.addInventoryItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ============================================================================
// FOREMAN AGENT HOOKS
// ============================================================================

export function useHarvestSchedule() {
  // Use real-time next harvest data
  const { harvests, isLoading } = useNextHarvest();
  
  // Transform next harvest to harvestSchedule format
  const harvestSchedule = useMemo(() => {
    return harvests.map((h) => ({
      id: h.id || h.fieldId,
      field: h.fieldName,
      crop: h.cropName,
      optimalDate: h.optimalDate instanceof Date 
        ? format(h.optimalDate, "MMM dd, yyyy")
        : format(new Date(h.optimalDate), "MMM dd, yyyy"),
      workers: h.workers || 0,
      status: h.status,
    }));
  }, [harvests]);

  return { data: harvestSchedule, isLoading, error: null };
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: () => foremanApi.getWorkers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDeliverySchedule() {
  return useQuery({
    queryKey: ['deliverySchedule'],
    queryFn: () => foremanApi.getDeliverySchedule(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useStorageRecommendations() {
  return useQuery({
    queryKey: ['storageRecommendations'],
    queryFn: () => foremanApi.getStorageRecommendations(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ============================================================================
// CHANCELLOR AGENT HOOKS
// ============================================================================

export function useCashflow() {
  return useQuery({
    queryKey: ['cashflow'],
    queryFn: () => chancellorApi.getCashflow(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useLoanOptions() {
  return useQuery({
    queryKey: ['loanOptions'],
    queryFn: () => chancellorApi.getLoanOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useInsuranceOptions() {
  return useQuery({
    queryKey: ['insuranceOptions'],
    queryFn: () => chancellorApi.getInsuranceOptions(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useRiskAnalysis() {
  return useQuery({
    queryKey: ['riskAnalysis'],
    queryFn: () => chancellorApi.getRiskAnalysis(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useRevenueProjections() {
  return useQuery({
    queryKey: ['revenueProjections'],
    queryFn: () => chancellorApi.getRevenueProjections(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ============================================================================
// MARKETPLACE HOOKS
// ============================================================================

export function useListings(search?: string) {
  return useQuery({
    queryKey: ['listings', search],
    queryFn: () => marketplaceApi.getListings(search),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => marketplaceApi.getTransactions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChatMessages(listingId: number) {
  return useQuery({
    queryKey: ['chatMessages', listingId],
    queryFn: () => marketplaceApi.getChatMessages(listingId),
    staleTime: 0, // Always fetch fresh chat messages
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (listing: Omit<Listing, 'id' | 'createdAt'>) => 
      marketplaceApi.createListing(listing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ============================================================================
// COMMUNITY HOOKS
// ============================================================================

export function useForumPosts(search?: string) {
  return useQuery({
    queryKey: ['forumPosts', search],
    queryFn: () => communityApi.getForumPosts(search),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => communityApi.getEvents(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useKnowledgeResources() {
  return useQuery({
    queryKey: ['knowledgeResources'],
    queryFn: () => communityApi.getKnowledgeResources(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (post: Omit<ForumPost, 'id' | 'replies' | 'views' | 'time'>) => 
      communityApi.createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forumPosts'] });
    },
  });
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: () => dashboardApi.getAlerts(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

