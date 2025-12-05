/**
 * Bank API Service (Mock)
 * Simulates integration with KCB, Equity Bank, and Cooperative Bank
 * In production, replace with actual bank API integrations
 */

export interface BankLoanOption {
  id: string;
  bank: "KCB" | "Equity" | "Cooperative";
  name: string;
  minAmount: number; // KSh
  maxAmount: number; // KSh
  interestRate: number; // Annual percentage
  minTerm: number; // months
  maxTerm: number; // months
  eligibilityCriteria: string[];
  specialOffers?: string[];
  processingFee?: number; // KSh
  requiresCollateral: boolean;
  applicationUrl?: string;
  monthlyPayment?: number;
  totalCost?: number;
}

/**
 * Mock delay to simulate API call
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get loan options from KCB
 */
export async function getKCBLoanOptions(): Promise<BankLoanOption[]> {
  await delay(500);
  return [
    {
      id: "kcb-agricredit-1",
      bank: "KCB",
      name: "KCB AgriCredit",
      minAmount: 50000,
      maxAmount: 10000000,
      interestRate: 8.5,
      minTerm: 6,
      maxTerm: 36,
      eligibilityCriteria: [
        "Active farmer for at least 2 years",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (3 months)",
      ],
      specialOffers: [
        "No processing fee for first-time applicants",
        "Flexible repayment during harvest season",
      ],
      requiresCollateral: false,
      applicationUrl: "https://kcbgroup.com/agricredit",
    },
    {
      id: "kcb-agricredit-2",
      bank: "KCB",
      name: "KCB AgriCredit Plus",
      minAmount: 1000000,
      maxAmount: 50000000,
      interestRate: 7.5,
      minTerm: 12,
      maxTerm: 60,
      eligibilityCriteria: [
        "Active farmer for at least 5 years",
        "Annual revenue above KSh 2M",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (6 months)",
        "Land title or lease agreement",
      ],
      specialOffers: [
        "Lower interest rate for established farmers",
        "Extended repayment period",
        "Free financial advisory services",
      ],
      requiresCollateral: true,
      applicationUrl: "https://kcbgroup.com/agricredit-plus",
    },
  ];
}

/**
 * Get loan options from Equity Bank
 */
export async function getEquityLoanOptions(): Promise<BankLoanOption[]> {
  await delay(500);
  return [
    {
      id: "equity-agricredit-1",
      bank: "Equity",
      name: "Equity AgriCredit",
      minAmount: 100000,
      maxAmount: 15000000,
      interestRate: 10.0,
      minTerm: 3,
      maxTerm: 24,
      eligibilityCriteria: [
        "Active farmer for at least 1 year",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (3 months)",
      ],
      specialOffers: [
        "Quick approval (24-48 hours)",
        "Mobile money disbursement",
      ],
      processingFee: 5000,
      requiresCollateral: false,
      applicationUrl: "https://equitybank.co.ke/agricredit",
    },
    {
      id: "equity-agricredit-2",
      bank: "Equity",
      name: "Equity AgriCredit Premium",
      minAmount: 5000000,
      maxAmount: 100000000,
      interestRate: 9.0,
      minTerm: 12,
      maxTerm: 84,
      eligibilityCriteria: [
        "Active farmer for at least 3 years",
        "Annual revenue above KSh 5M",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (12 months)",
        "Land title or lease agreement",
        "Business plan",
      ],
      specialOffers: [
        "Competitive interest rates",
        "Long repayment periods",
        "Dedicated relationship manager",
      ],
      processingFee: 10000,
      requiresCollateral: true,
      applicationUrl: "https://equitybank.co.ke/agricredit-premium",
    },
  ];
}

/**
 * Get loan options from Cooperative Bank
 */
export async function getCooperativeLoanOptions(): Promise<BankLoanOption[]> {
  await delay(500);
  return [
    {
      id: "coop-agricredit-1",
      bank: "Cooperative",
      name: "Co-op AgriCredit",
      minAmount: 50000,
      maxAmount: 8000000,
      interestRate: 9.5,
      minTerm: 6,
      maxTerm: 36,
      eligibilityCriteria: [
        "Active farmer for at least 2 years",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (3 months)",
        "Cooperative membership (preferred)",
      ],
      specialOffers: [
        "Special rates for cooperative members",
        "Group loan options available",
      ],
      processingFee: 3000,
      requiresCollateral: false,
      applicationUrl: "https://co-opbank.co.ke/agricredit",
    },
    {
      id: "coop-agricredit-2",
      bank: "Cooperative",
      name: "Co-op AgriCredit Enterprise",
      minAmount: 2000000,
      maxAmount: 75000000,
      interestRate: 8.0,
      minTerm: 12,
      maxTerm: 72,
      eligibilityCriteria: [
        "Active farmer for at least 5 years",
        "Annual revenue above KSh 3M",
        "Valid national ID",
        "Farm registration certificate",
        "Bank statements (12 months)",
        "Land title or lease agreement",
        "Business plan",
        "Cooperative membership",
      ],
      specialOffers: [
        "Best rates for cooperative members",
        "Flexible repayment schedules",
        "Agricultural extension services",
      ],
      processingFee: 15000,
      requiresCollateral: true,
      applicationUrl: "https://co-opbank.co.ke/agricredit-enterprise",
    },
  ];
}

/**
 * Get all loan options from all banks
 */
export async function getAllBankLoanOptions(): Promise<BankLoanOption[]> {
  const [kcb, equity, cooperative] = await Promise.all([
    getKCBLoanOptions(),
    getEquityLoanOptions(),
    getCooperativeLoanOptions(),
  ]);
  return [...kcb, ...equity, ...cooperative];
}

/**
 * Compare loan options
 */
export function compareLoanOptions(
  options: BankLoanOption[],
  amount: number,
  term: number
): BankLoanOption[] {
  return options
    .filter(opt => amount >= opt.minAmount && amount <= opt.maxAmount)
    .filter(opt => term >= opt.minTerm && term <= opt.maxTerm)
    .map(opt => ({
      ...opt,
      // Calculate total cost for comparison
      totalCost: amount + (amount * (opt.interestRate / 100) * (term / 12)),
      monthlyPayment: calculateMonthlyPayment(amount, opt.interestRate, term),
    }))
    .sort((a, b) => {
      // Sort by total cost (ascending)
      return (a.totalCost || 0) - (b.totalCost || 0);
    });
}

/**
 * Calculate monthly payment for a loan
 */
function calculateMonthlyPayment(
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

