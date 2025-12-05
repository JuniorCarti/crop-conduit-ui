/**
 * Lightweight unit checks for Chancellor finance calculations.
 * These run without a test runner to keep the project dependency-free.
 */

import { strict as assert } from "assert";
import {
  calculateLoanEligibilityScore,
  calculateMonthlyPayment,
  calculateROI,
  calculateTotalInterest,
} from "../financeCalculations";

// ROI
const roi = calculateROI(100_000, 150_000);
assert(Math.round(roi) === 50, "ROI should be 50%");

// Loan amortization
const monthlyPayment = calculateMonthlyPayment(500_000, 10, 12);
assert(Math.round(monthlyPayment) === 43958, "Monthly payment within expected range");
const totalInterest = calculateTotalInterest(500_000, monthlyPayment, 12);
assert(totalInterest > 0, "Total interest should be positive");

// Eligibility score
const eligibility = calculateLoanEligibilityScore(
  {
    farmSize: 5,
    revenueHistory: [300_000, 320_000, 310_000],
    repaymentHistory: 80,
    farmAge: 4,
    cropDiversity: 3,
    existingDebt: 100_000,
  },
  400_000
);
assert(eligibility.score > 60, "Eligibility score should be above threshold");
assert(eligibility.eligible === true, "Eligibility should be true for healthy profile");

export {};
