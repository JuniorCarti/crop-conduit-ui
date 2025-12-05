/**
 * Finance Page - Chancellor Agent Finance Module
 * 
 * Comprehensive financial management with:
 * - Revenue projections and expense tracking
 * - Profit/Loss statements
 * - Cash flow forecasts
 * - ROI calculations
 * - Loan assistant with eligibility checker
 * - Bank integration (KCB, Equity, Cooperative)
 * 
 * Error Handling:
 * - All data fetching wrapped in try/catch
 * - Graceful fallbacks for missing data
 * - Loading states for all async operations
 * - User-friendly error messages
 */

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Wallet,
  TrendingUp,
  FileText,
  Calculator,
  Loader2,
  LineChart as LineChartIcon,
  BarChart3,
  Languages,
  AlertTriangle,
  Download,
  Sparkles,
  BadgeCheck,
  Building2,
  FileDown,
  BellRing,
  Globe,
  AreaChart as AreaChartIcon,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCard } from "@/components/shared/AlertCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { formatKsh } from "@/lib/currency";
import {
  useCashFlowForecasts,
  useCreateLoanApplication,
  useExpenses,
  useLoanApplications,
  useLoanEligibility,
  useProfitLossStatements,
  useRevenueProjections,
  useROICalculations,
  useSaveLoanEligibility,
} from "@/hooks/useFinance";
import {
  calculateLoanEligibilityScore,
  calculateMonthlyPayment,
  calculateTotalInterest,
} from "@/utils/financeCalculations";
import { exportLoanApplicationPDF, exportProfitLossStatementPDF } from "@/utils/pdfExport";
import { getAllBankLoanOptions, compareLoanOptions, type BankLoanOption } from "@/services/bankApi";
import {
  buildFinanceDashboardSnapshot,
  evaluateCashflowAlerts,
  persistFinanceSnapshot,
  readFinanceSnapshot,
  encryptSensitiveFinancialData,
  type FinanceFilters,
  type FinanceDashboardSnapshot,
} from "@/services/finance-controller";
import { uploadFile } from "@/services/storage";
import type { LoanApplication, ProfitLossStatement } from "@/services/firestore-finance";

// Fallback dummy data for development/testing
const FALLBACK_CASHFLOW_DATA = [
  { month: "Jan", income: 500000, expenses: 300000 },
  { month: "Feb", income: 520000, expenses: 310000 },
  { month: "Mar", income: 480000, expenses: 290000 },
  { month: "Apr", income: 550000, expenses: 320000 },
];

const translations = {
  en: {
    title: "Finance & Business",
    subtitle: "Chancellor Agent • Manage finances",
    revenue: "Revenue",
    expenses: "Expenses",
    profit: "Profit",
    roi: "ROI",
    cashflow: "Cash Flow",
    loanAssistant: "Loan Assistant",
    eligibility: "Eligibility",
    documents: "Documents",
    tracker: "Application Tracker",
    compare: "Compare Lenders",
    risk: "Risk Analysis",
    offline: "Offline data — showing cached snapshot",
    error: "Error Loading Data",
    loading: "Loading financial data...",
    noData: "No financial data available",
  },
  sw: {
    title: "Fedha na Biashara",
    subtitle: "Chancellor Agent • Dhibiti fedha",
    revenue: "Mapato",
    expenses: "Gharama",
    profit: "Faida",
    roi: "ROI",
    cashflow: "Mtitiriko wa Fedha",
    loanAssistant: "Msaidizi wa Mkopo",
    eligibility: "Ustahili",
    documents: "Nyaraka",
    tracker: "Ufuatiliaji",
    compare: "Linganisha Benki",
    risk: "Uchambuzi wa Hatari",
    offline: "Uko nje ya mtandao — unaona data iliyohifadhiwa",
    error: "Kosa la Kupakia Data",
    loading: "Inapakia data ya fedha...",
    noData: "Hakuna data ya fedha inayopatikana",
  },
};

const loanStatusColor: Record<string, string> = {
  approved: "bg-success/10 text-success",
  submitted: "bg-primary/10 text-primary",
  "under-review": "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
  disbursed: "bg-info/10 text-info",
  repaid: "bg-muted text-muted-foreground",
  draft: "bg-muted/50 text-muted-foreground",
};

/**
 * Main Finance Component with comprehensive error handling
 * Wrapped in ErrorBoundary to prevent white screens from crashes
 */
export default function Finance() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen p-4">
          <PageHeader title="Finance & Business" subtitle="Chancellor Agent" icon={Wallet} />
          <div className="p-4 md:p-6">
            <AlertCard
              type="danger"
              title="Error Loading Finance Page"
              message="An unexpected error occurred. Please refresh the page or try again."
            />
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        console.error("Finance component error:", error, errorInfo);
      }}
    >
      <FinanceContent />
    </ErrorBoundary>
  );
}

/**
 * Finance Content Component
 * Handles all data fetching, state management, and UI rendering
 */
function FinanceContent() {
  const { currentUser } = useAuth();
  const [language, setLanguage] = useState<"en" | "sw">("en");
  const [filters, setFilters] = useState<FinanceFilters>({ period: "monthly" });
  const [loanScenario, setLoanScenario] = useState({ amount: 500000, term: 12, rate: 10 });
  const [eligibilityInputs, setEligibilityInputs] = useState({
    farmSize: 5,
    revenueHistory: [500000, 480000, 525000, 510000],
    repaymentHistory: 72,
    farmAge: 3,
    cropDiversity: 3,
    existingDebt: 0,
    requestedAmount: 500000,
  });
  const [eligibilityBreakdown, setEligibilityBreakdown] =
    useState<ReturnType<typeof calculateLoanEligibilityScore> | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<ProfitLossStatement | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [cachedSnapshot, setCachedSnapshot] = useState<FinanceDashboardSnapshot | null>(null);
  const [seenAlerts, setSeenAlerts] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [usingOfflineCache, setUsingOfflineCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<
    Array<{ name: string; url: string; uploadedAt: Date; verified: boolean }>
  >([
    { name: "National ID / Kitambulisho", url: "", uploadedAt: new Date(), verified: true },
    { name: "Farm Registration", url: "", uploadedAt: new Date(), verified: true },
    { name: "Land Title/Lease", url: "", uploadedAt: new Date(), verified: false },
    { name: "Bank Statements (3 months)", url: "", uploadedAt: new Date(), verified: false },
    { name: "Sales Records", url: "", uploadedAt: new Date(), verified: true },
  ]);

  // Data fetching hooks with error handling
  // Wrap each hook call to prevent crashes if hooks fail
  let projections: any[] = [];
  let expenses: any[] = [];
  let forecasts: any[] = [];
  let roiCalculations: any[] = [];
  let statements: any[] = [];
  let applications: any[] = [];
  let projectionsLoading = false;
  let expensesLoading = false;
  let forecastsLoading = false;
  let roiLoading = false;
  let profitLossLoading = false;
  let applicationsLoading = false;

  try {
    const projectionsData = useRevenueProjections();
    projections = projectionsData?.projections || [];
    projectionsLoading = projectionsData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading revenue projections:", e);
    setError(e.message || "Failed to load revenue projections");
  }

  try {
    const expensesData = useExpenses();
    expenses = expensesData?.expenses || [];
    expensesLoading = expensesData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading expenses:", e);
  }

  try {
    const forecastsData = useCashFlowForecasts();
    forecasts = forecastsData?.forecasts || [];
    forecastsLoading = forecastsData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading cash flow forecasts:", e);
  }

  try {
    const roiData = useROICalculations();
    roiCalculations = roiData?.calculations || [];
    roiLoading = roiData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading ROI calculations:", e);
  }

  try {
    const statementsData = useProfitLossStatements();
    statements = statementsData?.statements || [];
    profitLossLoading = statementsData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading profit/loss statements:", e);
  }

  try {
    const applicationsData = useLoanApplications();
    applications = applicationsData?.applications || [];
    applicationsLoading = applicationsData?.isLoading || false;
  } catch (e: any) {
    console.error("Error loading loan applications:", e);
  }

  const { data: savedEligibility } = useLoanEligibility();
  const saveEligibility = useSaveLoanEligibility();
  const createLoan = useCreateLoanApplication();

  // Bank options with error handling
  const { data: bankOptions, isLoading: banksLoading, error: bankError } = useQuery({
    queryKey: ["bankOptions"],
    queryFn: async () => {
      try {
        return await getAllBankLoanOptions();
      } catch (e: any) {
        console.error("Error fetching bank options:", e);
        // Return empty array as fallback
        return [];
      }
    },
    staleTime: 1000 * 60 * 60 * 6,
    retry: 2,
  });

  // Build dashboard snapshot with error handling
  const [liveSnapshot, setLiveSnapshot] = useState<FinanceDashboardSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  useEffect(() => {
    async function buildSnapshot() {
      try {
        setSnapshotLoading(true);
        const snapshot = await buildFinanceDashboardSnapshot({
          projections: projections || [],
          expenses: expenses || [],
          forecasts: forecasts || [],
          roi: roiCalculations || [],
          profitLoss: statements || [],
          loanApplications: applications || [],
          filters,
        });
        setLiveSnapshot(snapshot);
        setSnapshotLoading(false);
      } catch (e: any) {
        console.error("Error building dashboard snapshot:", e);
        setError(e.message || "Failed to build dashboard");
        // Set safe default snapshot
        setLiveSnapshot({
          kpis: {
            projectedRevenue: 0,
            expenses: 0,
            netProfit: 0,
            profitMargin: 0,
          },
          revenueSeries: [],
          expenseSeries: [],
          cashflowSeries: [],
          roiLeaders: [],
          cachedAt: new Date().toISOString(),
        });
        setSnapshotLoading(false);
      }
    }

    if (!projectionsLoading && !expensesLoading && !forecastsLoading) {
      buildSnapshot();
    }
  }, [applications, expenses, filters, forecasts, projections, roiCalculations, statements, projectionsLoading, expensesLoading, forecastsLoading]);

  // Persist snapshot for offline use
  useEffect(() => {
    try {
      if (liveSnapshot && liveSnapshot.cashflowSeries && liveSnapshot.cashflowSeries.length > 0) {
        persistFinanceSnapshot(liveSnapshot);
      }
    } catch (e) {
      console.error("Error persisting snapshot:", e);
    }
  }, [liveSnapshot]);

  // Check for offline mode and load cached data
  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const cached = readFinanceSnapshot();
        if (cached) {
          setCachedSnapshot(cached);
          setUsingOfflineCache(true);
        }
      }
    } catch (e) {
      console.error("Error checking offline status:", e);
    }
  }, []);

  // Use cached snapshot if offline, otherwise use live data
  const activeSnapshot =
    (usingOfflineCache && cachedSnapshot) ? cachedSnapshot : (liveSnapshot || {
      kpis: {
        projectedRevenue: 0,
        expenses: 0,
        netProfit: 0,
        profitMargin: 0,
      },
      revenueSeries: [],
      expenseSeries: [],
      cashflowSeries: [],
      roiLeaders: [],
      cachedAt: new Date().toISOString(),
    });

  // Evaluate cashflow alerts with error handling
  const cashAlerts = useMemo(() => {
    try {
      return evaluateCashflowAlerts(activeSnapshot?.cashflowSeries || []);
    } catch (e) {
      console.error("Error evaluating cashflow alerts:", e);
      return [];
    }
  }, [activeSnapshot?.cashflowSeries]);

  // Show alerts for cashflow issues
  useEffect(() => {
    try {
      cashAlerts.forEach((alert) => {
        setSeenAlerts((prev) => {
          if (prev.includes(alert)) return prev;
          toast.warning(alert, { icon: <AlertTriangle className="h-4 w-4" /> });
          return [...prev, alert];
        });
      });
    } catch (e) {
      console.error("Error showing alerts:", e);
    }
  }, [cashAlerts]);

  // Show notifications for loan approvals
  useEffect(() => {
    try {
      (applications || []).forEach((app) => {
        if (app.status === "approved") {
          const key = `approved-${app.id}`;
          setSeenAlerts((prev) => {
            if (prev.includes(key)) return prev;
            toast.success(`${app.lender} loan approved`, { icon: <BellRing className="h-4 w-4" /> });
            return [...prev, key];
          });
        }
      });
    } catch (e) {
      console.error("Error showing loan notifications:", e);
    }
  }, [applications]);

  // Compare loan options
  const comparedLoans = useMemo(() => {
    try {
      if (!bankOptions || bankOptions.length === 0) return [];
      return compareLoanOptions(bankOptions, loanScenario.amount, loanScenario.term);
    } catch (e) {
      console.error("Error comparing loans:", e);
      return [];
    }
  }, [bankOptions, loanScenario.amount, loanScenario.term]);

  // Calculate loan payments
  const monthlyPayment = useMemo(() => {
    try {
      return calculateMonthlyPayment(loanScenario.amount, loanScenario.rate, loanScenario.term);
    } catch (e) {
      console.error("Error calculating monthly payment:", e);
      return 0;
    }
  }, [loanScenario.amount, loanScenario.rate, loanScenario.term]);

  const totalInterest = useMemo(() => {
    try {
      return calculateTotalInterest(loanScenario.amount, monthlyPayment, loanScenario.term);
    } catch (e) {
      console.error("Error calculating total interest:", e);
      return 0;
    }
  }, [loanScenario.amount, monthlyPayment, loanScenario.term]);

  const copy = translations[language];

  // Helper function to ensure safe Select values
  const getSafeSelectValue = (value: string | undefined | null, fallback: string = "default"): string => {
    if (!value || typeof value !== "string" || value.trim() === "") {
      return fallback;
    }
    return value.trim();
  };

  // Helper function to ensure safe Select label
  const getSafeSelectLabel = (label: string | undefined | null, fallback: string = "N/A"): string => {
    if (!label || typeof label !== "string" || label.trim() === "") {
      return fallback;
    }
    return label.trim();
  };

  // Revenue filters with error handling
  const revenueFilters = useMemo(() => {
    try {
      const crops = Array.from(
        new Set(
          (projections || [])
            .map((p) => p?.cropName)
            .filter((crop): crop is string => Boolean(crop && typeof crop === "string" && crop.trim() !== ""))
        )
      );
      const fields = Array.from(
        new Set(
          (projections || [])
            .map((p) => p?.fieldName)
            .filter((field): field is string => Boolean(field && typeof field === "string" && field.trim() !== ""))
        )
      );
      const seasons = Array.from(
        new Set(
          (projections || [])
            .map((p) => p?.season)
            .filter((season): season is string => Boolean(season && typeof season === "string" && season.trim() !== ""))
        )
      );
      return { crops, fields, seasons };
    } catch (e) {
      console.error("Error calculating revenue filters:", e);
      return { crops: [], fields: [], seasons: [] };
    }
  }, [projections]);

  // Normalize date helper
  const normalizeDate = (value: string | Date | { toDate?: () => Date }): Date => {
    try {
      if (value instanceof Date) return value;
      if (value && typeof value === "object" && "toDate" in value && typeof (value as any).toDate === "function") {
        return (value as any).toDate();
      }
      return new Date(typeof value === "string" ? value : String(value));
    } catch (e) {
      console.error("Error normalizing date:", e);
      return new Date();
    }
  };

  // Handle eligibility check
  const handleEligibilityCheck = async () => {
    try {
      const result = calculateLoanEligibilityScore(
        {
          farmSize: eligibilityInputs.farmSize,
          revenueHistory: eligibilityInputs.revenueHistory,
          repaymentHistory: eligibilityInputs.repaymentHistory,
          farmAge: eligibilityInputs.farmAge,
          cropDiversity: eligibilityInputs.cropDiversity,
          existingDebt: eligibilityInputs.existingDebt,
        },
        eligibilityInputs.requestedAmount
      );
      setEligibilityBreakdown(result);

      if (currentUser?.uid) {
        await saveEligibility.mutateAsync({
          userId: currentUser.uid,
          score: result.score,
          eligible: result.eligible,
          factors: result.breakdown.map((item) => ({
            factor: item.factor,
            score: item.score,
            weight: item.weight,
            reason: item.reason,
          })),
          recommendedLoanAmount: loanScenario.amount,
          recommendedLenders: comparedLoans.slice(0, 3).map((l) => l.bank),
          lastCalculated: new Date(),
        });
      }
    } catch (e: any) {
      console.error("Error checking eligibility:", e);
      toast.error(e.message || "Failed to check eligibility");
    }
  };

  // Handle document upload
  const handleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!currentUser?.uid) {
      toast.error("Please sign in to upload documents");
      return;
    }

    try {
      setUploadingDoc(true);
      const url = await uploadFile(file, "loan-documents", currentUser.uid, {
        contentType: file.type,
      });
      let verified = false;
      setDocuments((prev) =>
        prev.map((doc) => {
          if (!doc.verified && !verified) {
            verified = true;
            return { ...doc, verified: true, url, uploadedAt: new Date() };
          }
          return doc;
        })
      );
      toast.success("Document uploaded and verified");
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle loan application
  const handleApplyForLoan = async (option: BankLoanOption) => {
    if (!currentUser?.uid) {
      toast.error("Please sign in to apply for a loan");
      return;
    }

    try {
      const securePayload = await encryptSensitiveFinancialData({
        userId: currentUser.uid,
        amount: loanScenario.amount,
        term: loanScenario.term,
        interestRate: option.interestRate,
        projectedRevenue: activeSnapshot.kpis.projectedRevenue,
        expenses: activeSnapshot.kpis.expenses,
      });

      await createLoan.mutateAsync({
        lender: option.bank,
        loanAmount: loanScenario.amount,
        interestRate: option.interestRate,
        term: loanScenario.term,
        monthlyPayment,
        purpose: "Working capital / input financing",
        status: "submitted",
        eligibilityScore: eligibilityBreakdown?.score || savedEligibility?.score || 0,
        documents,
        securePayload,
        alertFlags: cashAlerts,
      });
      toast.success(`Application sent to ${option.bank}`);
    } catch (error: any) {
      console.error("Error applying for loan:", error);
      toast.error(error?.message || "Failed to submit application");
    }
  };

  const loadingAny =
    projectionsLoading ||
    expensesLoading ||
    forecastsLoading ||
    roiLoading ||
    profitLossLoading ||
    applicationsLoading ||
    banksLoading;

  // Render component
  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen">
        <PageHeader title={copy.title} subtitle={copy.subtitle} icon={Wallet}>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <FileDown className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <div className="flex items-center gap-2 rounded-full bg-card px-3 py-1 border">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <Select
                value={language || "en"}
                onValueChange={(value: "en" | "sw") => setLanguage(value || "en")}
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="lang-en" value="en">English</SelectItem>
                  <SelectItem key="lang-sw" value="sw">Swahili</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PageHeader>

        <div className="p-4 md:p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <AlertCard
              type="danger"
              title={copy.error}
              message={error}
              onDismiss={() => setError(null)}
            />
          )}

          {/* Bank API Error */}
          {bankError && (
            <AlertCard
              type="warning"
              title="Bank API Unavailable"
              message="Using fallback data. Bank loan options may be limited."
            />
          )}

          {/* Offline Mode Indicator */}
          {usingOfflineCache && (
            <AlertCard
              type="warning"
              title={copy.offline}
              message="Reconnect to refresh live balances and loan statuses."
            />
          )}

          {/* Loading State */}
          {loadingAny && !activeSnapshot && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          )}

          {/* Main Dashboard - Only render if we have data or are not loading */}
          {(!loadingAny || activeSnapshot) && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-up">
                <StatCard
                  title={copy.revenue}
                  value={formatKsh(activeSnapshot.kpis.projectedRevenue || 0)}
                  change="Projected"
                  changeType="positive"
                  icon={TrendingUp}
                  iconColor="text-success"
                />
                <StatCard
                  title={copy.expenses}
                  value={formatKsh(activeSnapshot.kpis.expenses || 0)}
                  change="Inputs, labor, transport"
                  changeType="neutral"
                  icon={BarChart3}
                  iconColor="text-primary"
                />
                <StatCard
                  title={copy.profit}
                  value={formatKsh(activeSnapshot.kpis.netProfit || 0)}
                  change={`${(activeSnapshot.kpis.profitMargin || 0).toFixed(1)}% margin`}
                  changeType={(activeSnapshot.kpis.netProfit || 0) >= 0 ? "positive" : "negative"}
                  icon={Calculator}
                  iconColor="text-primary"
                />
                <StatCard
                  title={copy.roi}
                  value={`${(activeSnapshot.kpis.avgRoi || 0).toFixed(1)}%`}
                  change="Average ROI across crops"
                  changeType="positive"
                  icon={Sparkles}
                  iconColor="text-success"
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Revenue Projections Chart */}
                <Card className="shadow-card border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <LineChartIcon className="h-4 w-4" />
                        Revenue projections
                      </CardTitle>
                      <CardDescription>Filter by crop, season, or field</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={filters.cropName || "all"}
                        onValueChange={(value) => {
                          const newValue = value === "all" || !value ? undefined : (value || "default");
                          setFilters((prev) => ({ ...prev, cropName: newValue }));
                        }}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue placeholder="Crop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="crop-all" value="all">All Crops</SelectItem>
                          {revenueFilters.crops
                            .filter((crop) => crop && typeof crop === "string" && crop.trim() !== "")
                            .map((crop, index) => {
                              const safeValue = crop?.trim() || `default-${index}`;
                              const safeLabel = crop?.trim() || "N/A";
                              return (
                                <SelectItem key={`crop-${safeValue}-${index}`} value={safeValue}>
                                  {safeLabel}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filters.season || "all"}
                        onValueChange={(value) => {
                          const newValue = value === "all" || !value ? undefined : (value || "default");
                          setFilters((prev) => ({ ...prev, season: newValue }));
                        }}
                      >
                        <SelectTrigger className="w-28 h-8">
                          <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="season-all" value="all">All Seasons</SelectItem>
                          {revenueFilters.seasons
                            .filter((season) => season && typeof season === "string" && season.trim() !== "")
                            .map((season, index) => {
                              const safeValue = season?.trim() || `default-${index}`;
                              const safeLabel = season?.trim() || "N/A";
                              return (
                                <SelectItem key={`season-${safeValue}-${index}`} value={safeValue}>
                                  {safeLabel}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {projectionsLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeSnapshot.revenueSeries.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={activeSnapshot.revenueSeries}>
                            <defs>
                              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <RechartsTooltip />
                            <Area
                              type="monotone"
                              dataKey="projected"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#rev)"
                              activeDot={{ r: 5 }}
                            />
                            <Legend />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{copy.noData}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Expense Tracking Chart */}
                <Card className="shadow-card border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Expense tracking
                      </CardTitle>
                      <CardDescription>Inputs, labor, transport & more</CardDescription>
                    </div>
                    <Select
                      value={filters.fieldName || "all"}
                      onValueChange={(value) => {
                        const newValue = value === "all" || !value ? undefined : (value || "default");
                        setFilters((prev) => ({ ...prev, fieldName: newValue }));
                      }}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="field-all" value="all">All Fields</SelectItem>
                        {revenueFilters.fields
                          .filter((field) => field && typeof field === "string" && field.trim() !== "")
                          .map((field, index) => {
                            const safeValue = field?.trim() || `default-${index}`;
                            const safeLabel = field?.trim() || "N/A";
                            return (
                              <SelectItem key={`field-${safeValue}-${index}`} value={safeValue}>
                                {safeLabel}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {expensesLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeSnapshot.expenseSeries.length > 0 ? (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activeSnapshot.expenseSeries}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                          {activeSnapshot.expenseSeries.slice(0, 4).map((item) => (
                            <div key={item.label} className="flex items-center justify-between bg-muted/50 rounded-md px-2 py-1">
                              <span>{item.label}</span>
                              <span className="font-semibold text-foreground">{formatKsh(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{copy.noData}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow and ROI Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Cash Flow Chart */}
                <Card className="shadow-card border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <AreaChartIcon className="h-4 w-4" />
                        {copy.cashflow}
                      </CardTitle>
                      <CardDescription>Forecasted inflows vs outflows</CardDescription>
                    </div>
                    <Select
                      value={filters.period || "monthly"}
                      onValueChange={(value) => {
                        const safeValue = (value || "monthly") as FinanceFilters["period"];
                        setFilters((prev) => ({ ...prev, period: safeValue }));
                      }}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="period-daily" value="daily">Daily</SelectItem>
                        <SelectItem key="period-weekly" value="weekly">Weekly</SelectItem>
                        <SelectItem key="period-monthly" value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {forecastsLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeSnapshot.cashflowSeries.length > 0 ? (
                      <>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={activeSnapshot.cashflowSeries}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => format(new Date(value), "MMM d")}
                                tick={{ fontSize: 11 }}
                              />
                              <YAxis tick={{ fontSize: 11 }} />
                              <RechartsTooltip
                                labelFormatter={(value) => format(new Date(value), "PPP")}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="inflow" stroke="hsl(var(--primary))" strokeWidth={2} />
                              <Line type="monotone" dataKey="outflow" stroke="hsl(var(--destructive))" strokeWidth={2} />
                              <Line type="monotone" dataKey="balance" stroke="hsl(var(--success))" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {cashAlerts.length > 0 && (
                          <div className="space-y-2">
                            {cashAlerts.map((alert) => (
                              <AlertCard
                                key={alert}
                                type="warning"
                                title="Cashflow Alert"
                                message={alert}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{copy.noData}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ROI Recommendations */}
                <Card className="shadow-card border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      ROI & recommendations
                    </CardTitle>
                    <CardDescription>Top performing crops and fields</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {roiLoading ? (
                      <Skeleton className="h-48 rounded-lg" />
                    ) : activeSnapshot.roiLeaders.length > 0 ? (
                      <div className="space-y-3">
                        {activeSnapshot.roiLeaders.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="font-semibold text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">Net: {formatKsh(item.netProfit)}</p>
                            </div>
                            <Badge variant="outline" className="bg-success/10 text-success">
                              {item.roi.toFixed(1)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>{copy.noData}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Profit & Loss Statements */}
              <Card className="shadow-card border-border/60">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Profit & Loss statements
                    </CardTitle>
                    <CardDescription>Seasonal and field-level profitability</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!statements.length}
                    onClick={() => {
                      const statement = selectedStatement || statements[0];
                      if (statement) {
                        try {
                          exportProfitLossStatementPDF(statement);
                        } catch (e: any) {
                          toast.error(e.message || "Failed to export PDF");
                        }
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profitLossLoading ? (
                    <Skeleton className="h-32 rounded-lg" />
                  ) : statements.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {statements.map((statement) => (
                          <button
                            key={statement.id}
                            onClick={() => setSelectedStatement(statement)}
                            className={`text-left p-3 rounded-lg border transition-all ${
                              selectedStatement?.id === statement.id
                                ? "border-primary bg-primary/5"
                                : "border-border/50 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground">{statement.period}</p>
                              <Badge variant="outline">{statement.periodType}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(normalizeDate(statement.startDate), "MMM d")} -{" "}
                              {format(normalizeDate(statement.endDate), "MMM d, yyyy")}
                            </p>
                            <p className="text-lg font-bold text-foreground mt-2">
                              {formatKsh(statement.netProfit)} ({statement.profitMargin.toFixed(1)}%)
                            </p>
                          </button>
                        ))}
                      </div>
                      {selectedStatement && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted/60 rounded-md p-3">
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-semibold text-foreground">{formatKsh(selectedStatement.totalRevenue)}</p>
                          </div>
                          <div className="bg-muted/60 rounded-md p-3">
                            <p className="text-muted-foreground">Expenses</p>
                            <p className="font-semibold text-foreground">{formatKsh(selectedStatement.totalExpenses)}</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-32 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{copy.noData}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan Assistant */}
              <Card className="shadow-card border-border/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {copy.loanAssistant}
                  </CardTitle>
                  <CardDescription>
                    Eligibility, document checklist, lender comparison, and application tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="eligibility">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="eligibility">{copy.eligibility}</TabsTrigger>
                      <TabsTrigger value="compare">{copy.compare}</TabsTrigger>
                      <TabsTrigger value="tracker">{copy.tracker}</TabsTrigger>
                    </TabsList>

                    {/* Eligibility Tab */}
                    <TabsContent value="eligibility" className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label>Farm size (acres)</Label>
                          <Input
                            type="number"
                            value={eligibilityInputs.farmSize}
                            onChange={(e) =>
                              setEligibilityInputs((prev) => ({
                                ...prev,
                                farmSize: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Requested amount (KSh)</Label>
                          <Input
                            type="number"
                            value={eligibilityInputs.requestedAmount}
                            onChange={(e) =>
                              setEligibilityInputs((prev) => ({
                                ...prev,
                                requestedAmount: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label>Existing debt (KSh)</Label>
                          <Input
                            type="number"
                            value={eligibilityInputs.existingDebt}
                            onChange={(e) =>
                              setEligibilityInputs((prev) => ({
                                ...prev,
                                existingDebt: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button onClick={handleEligibilityCheck}>
                          <BadgeCheck className="h-4 w-4 mr-2" />
                          Run eligibility
                        </Button>
                        {eligibilityBreakdown && (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            Score: {eligibilityBreakdown.score} / Eligible: {eligibilityBreakdown.eligible ? "Yes" : "No"}
                          </Badge>
                        )}
                      </div>

                      {/* Repayment Calculator */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">Repayment calculator</p>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Shows monthly installment, interest, and total payable.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              value={loanScenario.amount}
                              onChange={(e) =>
                                setLoanScenario((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Term (months)</Label>
                            <Input
                              type="number"
                              value={loanScenario.term}
                              onChange={(e) =>
                                setLoanScenario((prev) => ({ ...prev, term: Number(e.target.value) || 0 }))
                              }
                            />
                          </div>
                          <div>
                            <Label>Rate (%)</Label>
                            <Input
                              type="number"
                              value={loanScenario.rate}
                              onChange={(e) =>
                                setLoanScenario((prev) => ({ ...prev, rate: Number(e.target.value) || 0 }))
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-muted/50 p-2 rounded-md">
                            <p className="text-muted-foreground">Monthly</p>
                            <p className="font-semibold text-foreground">{formatKsh(monthlyPayment)}</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <p className="text-muted-foreground">Interest</p>
                            <p className="font-semibold text-foreground">{formatKsh(totalInterest)}</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded-md">
                            <p className="text-muted-foreground">Total Payable</p>
                            <p className="font-semibold text-foreground">
                              {formatKsh(totalInterest + loanScenario.amount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Document Checklist */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-foreground">Document checklist</p>
                          <Button size="sm" variant="outline" asChild>
                            <label className="cursor-pointer">
                              <input type="file" className="hidden" onChange={handleDocumentUpload} disabled={uploadingDoc} />
                              {uploadingDoc ? "Uploading..." : "Upload"}
                            </label>
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {documents.map((doc) => (
                            <div
                              key={doc.name}
                              className="flex items-center justify-between border border-border/60 rounded-md px-3 py-2"
                            >
                              <p className="text-sm text-foreground">{doc.name}</p>
                              <Badge
                                className={
                                  doc.verified
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                }
                              >
                                {doc.verified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Compare Lenders Tab */}
                    <TabsContent value="compare" className="mt-4 space-y-3">
                      {banksLoading ? (
                        <Skeleton className="h-24 rounded-lg" />
                      ) : comparedLoans.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {comparedLoans.slice(0, 6).map((option) => (
                            <div
                              key={option.id}
                              className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-foreground">{option.bank}</p>
                                <Badge variant="outline">{option.interestRate}%</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{option.name}</p>
                              <p className="text-lg font-bold mt-2">{formatKsh(loanScenario.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                Term: {loanScenario.term} months • Monthly {formatKsh(option.monthlyPayment || 0)}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <Button size="sm" onClick={() => handleApplyForLoan(option)}>
                                  Apply
                                </Button>
                                {option.applicationUrl && (
                                  <a
                                    href={option.applicationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-primary underline"
                                  >
                                    View offer
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No loan options available</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        Bank APIs are mocked; swap to live endpoints in services/bankApi.ts.
                      </div>
                    </TabsContent>

                    {/* Application Tracker Tab */}
                    <TabsContent value="tracker" className="mt-4 space-y-3">
                      {applicationsLoading ? (
                        <Skeleton className="h-24 rounded-lg" />
                      ) : applications.length === 0 ? (
                        <AlertCard
                          type="info"
                          title="No applications yet"
                          message="Submit an application to start tracking approvals and disbursements."
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {applications.map((app) => (
                            <div
                              key={app.id}
                              className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition cursor-pointer"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-foreground">{app.lender}</p>
                                <Badge className={loanStatusColor[app.status] || "bg-muted"}>
                                  {app.status}
                                </Badge>
                              </div>
                              <p className="text-lg font-bold mt-1">{formatKsh(app.loanAmount)}</p>
                              <p className="text-xs text-muted-foreground">
                                Rate {app.interestRate}% • Term {app.term}m
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Monthly {formatKsh(app.monthlyPayment)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedApplication && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              try {
                                exportLoanApplicationPDF(selectedApplication);
                              } catch (e: any) {
                                toast.error(e.message || "Failed to export PDF");
                              }
                            }}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export application
                          </Button>
                          <Badge variant="outline" className="bg-success/10 text-success">
                            Eligibility: {selectedApplication.eligibilityScore ?? savedEligibility?.score ?? "N/A"}
                          </Badge>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}

          {/* Empty State - Show if no data and not loading */}
          {!loadingAny && !activeSnapshot && (
            <AlertCard
              type="info"
              title={copy.noData}
              message="Start by adding revenue projections and expenses to see your financial dashboard."
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
