/**
 * React hooks for Firestore Finance Chancellor Agent
 * Provides data fetching and mutations for financial operations
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  subscribeToRevenueProjections,
  createRevenueProjection,
  updateRevenueProjection,
  deleteRevenueProjection,
  subscribeToExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  subscribeToProfitLossStatements,
  createProfitLossStatement,
  subscribeToCashFlowForecasts,
  createCashFlowForecast,
  subscribeToROICalculations,
  createROICalculation,
  subscribeToLoanApplications,
  createLoanApplication,
  updateLoanApplication,
  getLoanEligibility,
  saveLoanEligibility,
  type RevenueProjection,
  type Expense,
  type ProfitLossStatement,
  type CashFlowForecast,
  type ROICalculation,
  type LoanApplication,
  type LoanEligibility,
} from "@/services/firestore-finance";

// ============================================================================
// REVENUE PROJECTIONS HOOKS
// ============================================================================

export function useRevenueProjections() {
  const { currentUser } = useAuth();
  const [projections, setProjections] = useState<RevenueProjection[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToRevenueProjections(currentUser.uid, (data) => {
      setProjections(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { projections, isLoading: !currentUser?.uid };
}

export function useCreateRevenueProjection() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (projection: Omit<RevenueProjection, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createRevenueProjection({
        ...projection,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenueProjections"] });
      toast.success("Revenue projection created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create revenue projection");
    },
  });
}

// ============================================================================
// EXPENSES HOOKS
// ============================================================================

export function useExpenses() {
  const { currentUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToExpenses(currentUser.uid, (data) => {
      setExpenses(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { expenses, isLoading: !currentUser?.uid };
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createExpense({
        ...expense,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record expense");
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      return updateExpense(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update expense");
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete expense");
    },
  });
}

// ============================================================================
// PROFIT/LOSS STATEMENTS HOOKS
// ============================================================================

export function useProfitLossStatements() {
  const { currentUser } = useAuth();
  const [statements, setStatements] = useState<ProfitLossStatement[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToProfitLossStatements(currentUser.uid, (data) => {
      setStatements(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { statements, isLoading: !currentUser?.uid };
}

export function useCreateProfitLossStatement() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (statement: Omit<ProfitLossStatement, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createProfitLossStatement({
        ...statement,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profitLossStatements"] });
      toast.success("Profit/Loss statement created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create profit/loss statement");
    },
  });
}

// ============================================================================
// CASH FLOW FORECASTS HOOKS
// ============================================================================

export function useCashFlowForecasts() {
  const { currentUser } = useAuth();
  const [forecasts, setForecasts] = useState<CashFlowForecast[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToCashFlowForecasts(currentUser.uid, (data) => {
      setForecasts(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { forecasts, isLoading: !currentUser?.uid };
}

export function useCreateCashFlowForecast() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (forecast: Omit<CashFlowForecast, "id" | "createdAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createCashFlowForecast({
        ...forecast,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashFlowForecasts"] });
      toast.success("Cash flow forecast created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create cash flow forecast");
    },
  });
}

// ============================================================================
// ROI CALCULATIONS HOOKS
// ============================================================================

export function useROICalculations() {
  const { currentUser } = useAuth();
  const [calculations, setCalculations] = useState<ROICalculation[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToROICalculations(currentUser.uid, (data) => {
      setCalculations(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { calculations, isLoading: !currentUser?.uid };
}

export function useCreateROICalculation() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (calculation: Omit<ROICalculation, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createROICalculation({
        ...calculation,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roiCalculations"] });
      toast.success("ROI calculation created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ROI calculation");
    },
  });
}

// ============================================================================
// LOAN APPLICATIONS HOOKS
// ============================================================================

export function useLoanApplications() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToLoanApplications(currentUser.uid, (data) => {
      setApplications(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { applications, isLoading: !currentUser?.uid };
}

export function useCreateLoanApplication() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (application: Omit<LoanApplication, "id" | "createdAt" | "updatedAt" | "userId">) => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return createLoanApplication({
        ...application,
        userId: currentUser.uid,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      toast.success("Loan application created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create loan application");
    },
  });
}

export function useUpdateLoanApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LoanApplication> }) => {
      return updateLoanApplication(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanApplications"] });
      toast.success("Loan application updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update loan application");
    },
  });
}

// ============================================================================
// LOAN ELIGIBILITY HOOKS
// ============================================================================

export function useLoanEligibility() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ["loanEligibility", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) throw new Error("User must be authenticated");
      return getLoanEligibility(currentUser.uid);
    },
    enabled: !!currentUser?.uid,
  });
}

export function useSaveLoanEligibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eligibility: LoanEligibility) => {
      return saveLoanEligibility(eligibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanEligibility"] });
      toast.success("Loan eligibility saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save loan eligibility");
    },
  });
}

