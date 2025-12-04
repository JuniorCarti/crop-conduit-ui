import { useState } from "react";
import { Wallet, TrendingUp, FileText, Shield, Calculator, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { cashflowData, loanOptions, insuranceOptions } from "@/data/dummyData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
import { Progress } from "@/components/ui/progress";

export default function Finance() {
  const [selectedLoan, setSelectedLoan] = useState<typeof loanOptions[0] | null>(null);
  const [showDocChecklist, setShowDocChecklist] = useState(false);

  const totalRevenue = cashflowData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = cashflowData.reduce((sum, m) => sum + m.expenses, 0);
  const profit = totalRevenue - totalExpenses;

  const documents = [
    { name: "National ID", status: "verified" },
    { name: "Farm Registration", status: "verified" },
    { name: "Land Title/Lease", status: "pending" },
    { name: "Bank Statements (3 months)", status: "pending" },
    { name: "Sales Records", status: "verified" },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Finance & Business" 
        subtitle="Chancellor Agent • Manage finances"
        icon={Wallet}
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fade-up">
          <StatCard
            title="Total Revenue"
            value={`$${(totalRevenue / 1000).toFixed(0)}K`}
            change="+18% vs last period"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-success"
          />
          <StatCard
            title="Net Profit"
            value={`$${(profit / 1000).toFixed(0)}K`}
            change={`${((profit / totalRevenue) * 100).toFixed(0)}% margin`}
            changeType="positive"
            icon={Calculator}
            iconColor="text-primary"
          />
        </div>

        {/* Cashflow Chart */}
        <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Cash Flow</h3>
                <p className="text-xs text-muted-foreground">Revenue vs Expenses</p>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Expenses</span>
              </div>
            </div>
          </div>
        </section>

        <Tabs defaultValue="loans" className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="loans">Loan Options</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          </TabsList>

          {/* Loans Tab */}
          <TabsContent value="loans" className="mt-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Based on your profile</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary h-8"
                onClick={() => setShowDocChecklist(true)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Documents
              </Button>
            </div>
            {loanOptions.map((loan) => (
              <button
                key={loan.id}
                onClick={() => setSelectedLoan(loan)}
                className="w-full bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{loan.provider}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">${loan.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{loan.rate} APR</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{loan.term}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                      {loan.status}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-2">Protect your farm</p>
            {insuranceOptions.map((insurance) => (
              <div 
                key={insurance.id}
                className="bg-card rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{insurance.type}</p>
                      <p className="text-sm text-muted-foreground">{insurance.coverage}</p>
                      <p className="text-xs text-muted-foreground mt-1">{insurance.provider}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">${insurance.premium}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Get Quote
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Risk Analysis */}
        <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Risk Analysis</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Weather Risk</span>
                  <span className="text-sm font-medium text-warning">Medium</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Market Risk</span>
                  <span className="text-sm font-medium text-success">Low</span>
                </div>
                <Progress value={25} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Pest Risk</span>
                  <span className="text-sm font-medium text-destructive">High</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Loan Detail Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={() => setSelectedLoan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLoan?.provider}</DialogTitle>
            <DialogDescription>Loan application details</DialogDescription>
          </DialogHeader>
          {selectedLoan && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold text-foreground">${selectedLoan.amount.toLocaleString()}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Interest Rate</p>
                  <p className="text-xl font-bold text-foreground">{selectedLoan.rate}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Term</p>
                  <p className="text-xl font-bold text-foreground">{selectedLoan.term}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Monthly Payment</p>
                  <p className="text-xl font-bold text-foreground">
                    ${(selectedLoan.amount / parseInt(selectedLoan.term) * 1.08).toFixed(0)}
                  </p>
                </div>
              </div>

              <div className="bg-success/10 rounded-lg p-3">
                <p className="text-sm font-medium text-success">
                  ✓ You are eligible for this loan
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Apply Now</Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedLoan(null);
                    setShowDocChecklist(true);
                  }}
                >
                  Check Documents
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Checklist Modal */}
      <Dialog open={showDocChecklist} onOpenChange={setShowDocChecklist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Checklist</DialogTitle>
            <DialogDescription>Documents required for loan applications</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {documents.map((doc, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  doc.status === "verified" 
                    ? "bg-success/10" 
                    : "bg-warning/10"
                }`}
              >
                <span className="text-sm font-medium text-foreground">{doc.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  doc.status === "verified"
                    ? "bg-success/20 text-success"
                    : "bg-warning/20 text-warning"
                }`}>
                  {doc.status === "verified" ? "✓ Verified" : "Pending"}
                </span>
              </div>
            ))}
            <Button className="w-full mt-4">Upload Missing Documents</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
