/**
 * Financial calculation utilities for Chancellor Agent
 * Includes ROI, loan eligibility, repayment calculations, etc.
 */

import type { Expense, RevenueProjection, ROICalculation, LoanApplication } from "@/services/firestore-finance";

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(
  totalInvestment: number,
  totalRevenue: number
): number {
  if (totalInvestment === 0) return 0;
  return ((totalRevenue - totalInvestment) / totalInvestment) * 100;
}

/**
 * Calculate payback period in months
 */
export function calculatePaybackPeriod(
  totalInvestment: number,
  monthlyProfit: number
): number {
  if (monthlyProfit <= 0) return Infinity;
  return totalInvestment / monthlyProfit;
}

/**
 * Calculate loan monthly payment using amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (termMonths === 0) return principal;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return payment;
}

/**
 * Calculate total interest paid over loan term
 */
export function calculateTotalInterest(
  principal: number,
  monthlyPayment: number,
  termMonths: number
): number {
  return (monthlyPayment * termMonths) - principal;
}

/**
 * Calculate loan eligibility score based on various factors
 */
export interface EligibilityFactors {
  farmSize: number; // acres
  revenueHistory: number[]; // last 12 months revenue
  repaymentHistory?: number; // 0-100 score
  farmAge?: number; // years
  cropDiversity?: number; // number of different crops
  existingDebt?: number; // KSh
}

export function calculateLoanEligibilityScore(
  factors: EligibilityFactors,
  requestedAmount: number
): {
  score: number;
  eligible: boolean;
  breakdown: Array<{ factor: string; score: number; weight: number; reason: string }>;
} {
  const breakdown: Array<{ factor: string; score: number; weight: number; reason: string }> = [];
  let totalScore = 0;
  let totalWeight = 0;

  // Farm Size Factor (20% weight)
  const farmSizeScore = Math.min(100, (factors.farmSize / 10) * 100);
  const farmSizeWeight = 0.2;
  breakdown.push({
    factor: "Farm Size",
    score: farmSizeScore,
    weight: farmSizeWeight,
    reason: factors.farmSize >= 5 ? "Good farm size" : "Small farm size",
  });
  totalScore += farmSizeScore * farmSizeWeight;
  totalWeight += farmSizeWeight;

  // Revenue History Factor (30% weight)
  const avgRevenue = factors.revenueHistory.length > 0
    ? factors.revenueHistory.reduce((a, b) => a + b, 0) / factors.revenueHistory.length
    : 0;
  const revenueScore = Math.min(100, (avgRevenue / 100000) * 10); // 100K = 10 points
  const revenueWeight = 0.3;
  breakdown.push({
    factor: "Revenue History",
    score: revenueScore,
    weight: revenueWeight,
    reason: avgRevenue >= 500000 ? "Strong revenue history" : "Limited revenue history",
  });
  totalScore += revenueScore * revenueWeight;
  totalWeight += revenueWeight;

  // Repayment History Factor (25% weight)
  const repaymentScore = factors.repaymentHistory || 50; // Default to 50 if no history
  const repaymentWeight = 0.25;
  breakdown.push({
    factor: "Repayment History",
    score: repaymentScore,
    weight: repaymentWeight,
    reason: repaymentScore >= 80 ? "Excellent repayment history" : 
            repaymentScore >= 60 ? "Good repayment history" : "Poor repayment history",
  });
  totalScore += repaymentScore * repaymentWeight;
  totalWeight += repaymentWeight;

  // Farm Age Factor (10% weight)
  const farmAgeScore = factors.farmAge 
    ? Math.min(100, (factors.farmAge / 5) * 20) // 5 years = 20 points
    : 50; // Default if unknown
  const farmAgeWeight = 0.1;
  breakdown.push({
    factor: "Farm Age",
    score: farmAgeScore,
    weight: farmAgeWeight,
    reason: factors.farmAge && factors.farmAge >= 3 ? "Established farm" : "New farm",
  });
  totalScore += farmAgeScore * farmAgeWeight;
  totalWeight += farmAgeWeight;

  // Crop Diversity Factor (10% weight)
  const diversityScore = factors.cropDiversity 
    ? Math.min(100, factors.cropDiversity * 20) // 5 crops = 100 points
    : 50;
  const diversityWeight = 0.1;
  breakdown.push({
    factor: "Crop Diversity",
    score: diversityScore,
    weight: diversityWeight,
    reason: factors.cropDiversity && factors.cropDiversity >= 3 ? "Diversified crops" : "Limited diversity",
  });
  totalScore += diversityScore * diversityWeight;
  totalWeight += diversityWeight;

  // Debt-to-Revenue Ratio Factor (5% weight)
  const debtRatio = factors.existingDebt && avgRevenue > 0
    ? (factors.existingDebt / avgRevenue) * 100
    : 0;
  const debtScore = debtRatio < 30 ? 100 : debtRatio < 50 ? 70 : debtRatio < 70 ? 40 : 10;
  const debtWeight = 0.05;
  breakdown.push({
    factor: "Debt Ratio",
    score: debtScore,
    weight: debtWeight,
    reason: debtRatio < 30 ? "Low debt burden" : 
            debtRatio < 50 ? "Moderate debt" : "High debt burden",
  });
  totalScore += debtScore * debtWeight;
  totalWeight += debtWeight;

  // Normalize score
  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  const eligible = finalScore >= 60 && requestedAmount <= avgRevenue * 2;

  return {
    score: Math.round(finalScore),
    eligible,
    breakdown,
  };
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
}

/**
 * Aggregate expenses by category
 */
export function aggregateExpensesByCategory(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const key = expense.category || expense.type;
    acc[key] = (acc[key] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Aggregate expenses by field
 */
export function aggregateExpensesByField(expenses: Expense[]): Record<string, number> {
  return expenses.reduce((acc, expense) => {
    const key = expense.fieldName || "Unassigned";
    acc[key] = (acc[key] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate projected revenue from projections
 */
export function calculateProjectedRevenue(projections: RevenueProjection[]): number {
  return projections.reduce((sum, proj) => sum + proj.projectedRevenue, 0);
}

/**
 * Generate cash flow forecast from expenses and revenue projections
 */
export function generateCashFlowForecast(
  expenses: Expense[],
  projections: RevenueProjection[],
  startDate: Date,
  endDate: Date,
  period: "daily" | "weekly" | "monthly"
): Array<{ date: Date; inflow: number; outflow: number; netFlow: number; balance: number }> {
  const forecast: Array<{ date: Date; inflow: number; outflow: number; netFlow: number; balance: number }> = [];
  let balance = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Calculate inflow for this period (from projections)
    const periodInflow = projections
      .filter(p => {
        const projDate = new Date(p.createdAt || new Date());
        return projDate <= currentDate;
      })
      .reduce((sum, p) => sum + (p.projectedRevenue / 30), 0); // Rough daily estimate

    // Calculate outflow for this period (from expenses)
    const periodOutflow = expenses
      .filter(e => {
        const expDate = new Date(e.date);
        return expDate.getTime() === currentDate.getTime();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const netFlow = periodInflow - periodOutflow;
    balance += netFlow;

    forecast.push({
      date: new Date(currentDate),
      inflow: periodInflow,
      outflow: periodOutflow,
      netFlow,
      balance,
    });

    // Move to next period
    if (period === "daily") {
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (period === "weekly") {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return forecast;
}

