/**
 * Firestore Service for Finance Chancellor Agent
 * Handles all financial-related database operations
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================================
// FINANCIAL DATA INTERFACES
// ============================================================================

export interface RevenueProjection {
  id?: string;
  cropId: string;
  cropName: string;
  fieldId: string;
  fieldName: string;
  season: string; // e.g., "2024 Long Rains"
  projectedYield: number; // tons or kg
  marketPrice: number; // KSh per unit
  projectedRevenue: number; // KSh
  confidence: "high" | "medium" | "low";
  basedOnHistorical: boolean;
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface Expense {
  id?: string;
  type: "input" | "labor" | "transport" | "equipment" | "utilities" | "other";
  category: string; // e.g., "Fertilizer", "Seeds", "Pesticides"
  description: string;
  amount: number; // KSh
  fieldId?: string;
  fieldName?: string;
  cropId?: string;
  cropName?: string;
  date: Date | Timestamp | string;
  supplier?: string;
  receiptUrl?: string; // Supabase Storage URL
  notes?: string;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface ProfitLossStatement {
  id?: string;
  period: string; // e.g., "2024 Q1", "2024 Long Rains"
  periodType: "quarterly" | "seasonal" | "annual";
  startDate: Date | Timestamp | string;
  endDate: Date | Timestamp | string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  fieldBreakdown?: {
    fieldId: string;
    fieldName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  cropBreakdown?: {
    cropId: string;
    cropName: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface CashFlowForecast {
  id?: string;
  date: Date | Timestamp | string;
  period: "daily" | "weekly" | "monthly";
  inflow: number; // KSh
  outflow: number; // KSh
  netFlow: number; // KSh
  balance: number; // KSh (cumulative)
  category?: string;
  description?: string;
  createdAt?: Date | Timestamp | string;
  userId?: string;
}

export interface ROICalculation {
  id?: string;
  cropId?: string;
  cropName?: string;
  fieldId?: string;
  fieldName?: string;
  period: string;
  totalInvestment: number; // KSh
  totalRevenue: number; // KSh
  netProfit: number; // KSh
  roi: number; // percentage
  paybackPeriod?: number; // months
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface LoanApplication {
  id?: string;
  lender: "KCB" | "Equity" | "Cooperative" | "Other";
  loanAmount: number; // KSh
  interestRate: number; // percentage
  term: number; // months
  monthlyPayment: number; // KSh
  purpose: string;
  status: "draft" | "submitted" | "under-review" | "approved" | "rejected" | "disbursed" | "repaid";
  eligibilityScore?: number; // 0-100
  documents?: {
    name: string;
    url: string; // Supabase Storage URL
    uploadedAt: Date | Timestamp | string;
    verified: boolean;
  }[];
  submittedAt?: Date | Timestamp | string;
  approvedAt?: Date | Timestamp | string;
  disbursedAt?: Date | Timestamp | string;
  notes?: string;
  securePayload?: string; // encrypted snapshot of sensitive fields
  alertFlags?: string[];
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
  userId?: string;
}

export interface LoanEligibility {
  userId: string;
  score: number; // 0-100
  eligible: boolean;
  factors: {
    factor: string;
    score: number;
    weight: number;
    reason: string;
  }[];
  recommendedLoanAmount?: number;
  recommendedLenders?: string[];
  lastCalculated: Date | Timestamp | string;
}

// Collection names
const REVENUE_PROJECTIONS_COLLECTION = "revenueProjections";
const EXPENSES_COLLECTION = "expenses";
const PROFIT_LOSS_COLLECTION = "profitLossStatements";
const CASH_FLOW_COLLECTION = "cashFlowForecasts";
const ROI_COLLECTION = "roiCalculations";
const LOAN_APPLICATIONS_COLLECTION = "loanApplications";
const LOAN_ELIGIBILITY_COLLECTION = "loanEligibility";

// Helper function to convert Firestore timestamps
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (timestamp?.toDate) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);
  return new Date();
};

// ============================================================================
// REVENUE PROJECTIONS OPERATIONS
// ============================================================================

export function subscribeToRevenueProjections(
  userId: string,
  callback: (projections: RevenueProjection[]) => void
) {
  const q = query(
    collection(db, REVENUE_PROJECTIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projections = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as RevenueProjection;
      });
      callback(projections);
    },
    (error) => {
      console.error("Error subscribing to revenue projections:", error);
      callback([]);
    }
  );
}

export async function createRevenueProjection(
  projection: Omit<RevenueProjection, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REVENUE_PROJECTIONS_COLLECTION), {
      ...projection,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating revenue projection:", error);
    throw error;
  }
}

export async function updateRevenueProjection(
  id: string,
  updates: Partial<RevenueProjection>
): Promise<void> {
  try {
    const docRef = doc(db, REVENUE_PROJECTIONS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating revenue projection:", error);
    throw error;
  }
}

export async function deleteRevenueProjection(id: string): Promise<void> {
  try {
    const docRef = doc(db, REVENUE_PROJECTIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting revenue projection:", error);
    throw error;
  }
}

// ============================================================================
// EXPENSES OPERATIONS
// ============================================================================

export function subscribeToExpenses(
  userId: string,
  callback: (expenses: Expense[]) => void
) {
  const q = query(
    collection(db, EXPENSES_COLLECTION),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as Expense;
      });
      callback(expenses);
    },
    (error) => {
      console.error("Error subscribing to expenses:", error);
      callback([]);
    }
  );
}

export async function createExpense(
  expense: Omit<Expense, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const cleanData: any = {
      ...expense,
      date: expense.date instanceof Date ? Timestamp.fromDate(expense.date) : expense.date,
      receiptUrl: expense.receiptUrl || "",
      notes: expense.notes || "",
      supplier: expense.supplier || "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function updateExpense(
  id: string,
  updates: Partial<Expense>
): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    const cleanUpdates: any = { ...updates };
    if (updates.date) {
      cleanUpdates.date = updates.date instanceof Date 
        ? Timestamp.fromDate(updates.date) 
        : updates.date;
    }
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

export async function deleteExpense(id: string): Promise<void> {
  try {
    const docRef = doc(db, EXPENSES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

// ============================================================================
// PROFIT/LOSS STATEMENTS OPERATIONS
// ============================================================================

export function subscribeToProfitLossStatements(
  userId: string,
  callback: (statements: ProfitLossStatement[]) => void
) {
  const q = query(
    collection(db, PROFIT_LOSS_COLLECTION),
    where("userId", "==", userId),
    orderBy("startDate", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const statements = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: convertTimestamp(data.startDate),
          endDate: convertTimestamp(data.endDate),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as ProfitLossStatement;
      });
      callback(statements);
    },
    (error) => {
      console.error("Error subscribing to profit/loss statements:", error);
      callback([]);
    }
  );
}

export async function createProfitLossStatement(
  statement: Omit<ProfitLossStatement, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const cleanData: any = {
      ...statement,
      startDate: statement.startDate instanceof Date 
        ? Timestamp.fromDate(statement.startDate) 
        : statement.startDate,
      endDate: statement.endDate instanceof Date 
        ? Timestamp.fromDate(statement.endDate) 
        : statement.endDate,
      fieldBreakdown: statement.fieldBreakdown || [],
      cropBreakdown: statement.cropBreakdown || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, PROFIT_LOSS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating profit/loss statement:", error);
    throw error;
  }
}

// ============================================================================
// CASH FLOW FORECASTS OPERATIONS
// ============================================================================

export function subscribeToCashFlowForecasts(
  userId: string,
  callback: (forecasts: CashFlowForecast[]) => void
) {
  const q = query(
    collection(db, CASH_FLOW_COLLECTION),
    where("userId", "==", userId),
    orderBy("date", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const forecasts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
        } as CashFlowForecast;
      });
      callback(forecasts);
    },
    (error) => {
      console.error("Error subscribing to cash flow forecasts:", error);
      callback([]);
    }
  );
}

export async function createCashFlowForecast(
  forecast: Omit<CashFlowForecast, "id" | "createdAt">
): Promise<string> {
  try {
    const cleanData: any = {
      ...forecast,
      date: forecast.date instanceof Date 
        ? Timestamp.fromDate(forecast.date) 
        : forecast.date,
      category: forecast.category || "",
      description: forecast.description || "",
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, CASH_FLOW_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating cash flow forecast:", error);
    throw error;
  }
}

// ============================================================================
// ROI CALCULATIONS OPERATIONS
// ============================================================================

export function subscribeToROICalculations(
  userId: string,
  callback: (calculations: ROICalculation[]) => void
) {
  const q = query(
    collection(db, ROI_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const calculations = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as ROICalculation;
      });
      callback(calculations);
    },
    (error) => {
      console.error("Error subscribing to ROI calculations:", error);
      callback([]);
    }
  );
}

export async function createROICalculation(
  calculation: Omit<ROICalculation, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ROI_COLLECTION), {
      ...calculation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating ROI calculation:", error);
    throw error;
  }
}

// ============================================================================
// LOAN APPLICATIONS OPERATIONS
// ============================================================================

export function subscribeToLoanApplications(
  userId: string,
  callback: (applications: LoanApplication[]) => void
) {
  const q = query(
    collection(db, LOAN_APPLICATIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const applications = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt ? convertTimestamp(data.submittedAt) : undefined,
          approvedAt: data.approvedAt ? convertTimestamp(data.approvedAt) : undefined,
          disbursedAt: data.disbursedAt ? convertTimestamp(data.disbursedAt) : undefined,
          documents: (data.documents || []).map((doc: any) => ({
            ...doc,
            uploadedAt: convertTimestamp(doc.uploadedAt),
          })),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        } as LoanApplication;
      });
      callback(applications);
    },
    (error) => {
      console.error("Error subscribing to loan applications:", error);
      callback([]);
    }
  );
}

export async function createLoanApplication(
  application: Omit<LoanApplication, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  try {
    const cleanData: any = {
      ...application,
      documents: application.documents || [],
      notes: application.notes || "",
      securePayload: application.securePayload || "",
      alertFlags: application.alertFlags || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, LOAN_APPLICATIONS_COLLECTION), cleanData);
    return docRef.id;
  } catch (error) {
    console.error("Error creating loan application:", error);
    throw error;
  }
}

export async function updateLoanApplication(
  id: string,
  updates: Partial<LoanApplication>
): Promise<void> {
  try {
    const docRef = doc(db, LOAN_APPLICATIONS_COLLECTION, id);
    const cleanUpdates: any = { ...updates };
    if (updates.submittedAt) {
      cleanUpdates.submittedAt = updates.submittedAt instanceof Date 
        ? Timestamp.fromDate(updates.submittedAt) 
        : updates.submittedAt;
    }
    if (updates.approvedAt) {
      cleanUpdates.approvedAt = updates.approvedAt instanceof Date 
        ? Timestamp.fromDate(updates.approvedAt) 
        : updates.approvedAt;
    }
    if (updates.disbursedAt) {
      cleanUpdates.disbursedAt = updates.disbursedAt instanceof Date 
        ? Timestamp.fromDate(updates.disbursedAt) 
        : updates.disbursedAt;
    }
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating loan application:", error);
    throw error;
  }
}

// ============================================================================
// LOAN ELIGIBILITY OPERATIONS
// ============================================================================

export async function getLoanEligibility(userId: string): Promise<LoanEligibility | null> {
  try {
    const docRef = doc(db, LOAN_ELIGIBILITY_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        lastCalculated: convertTimestamp(data.lastCalculated),
      } as LoanEligibility;
    }
    return null;
  } catch (error) {
    console.error("Error getting loan eligibility:", error);
    throw error;
  }
}

export async function saveLoanEligibility(eligibility: LoanEligibility): Promise<void> {
  try {
    const docRef = doc(db, LOAN_ELIGIBILITY_COLLECTION, eligibility.userId);
    await updateDoc(docRef, {
      ...eligibility,
      lastCalculated: Timestamp.now(),
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await addDoc(collection(db, LOAN_ELIGIBILITY_COLLECTION), {
        ...eligibility,
        lastCalculated: Timestamp.now(),
      });
    } catch (createError) {
      console.error("Error saving loan eligibility:", createError);
      throw createError;
    }
  }
}

