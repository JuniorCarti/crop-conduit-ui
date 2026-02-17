import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BuyerSkeletonBlocks } from "@/components/buyer/BuyerSkeletonBlocks";
import { BuyerTableEmptyState } from "@/components/buyer/BuyerTableEmptyState";
import { BuyerInvoiceTable, BuyerTransactionTable } from "@/components/buyer/BuyerBillingTables";
import { getBuyerBillingView } from "@/services/buyerBillingService";
import { useAuth } from "@/contexts/AuthContext";
import type { BuyerBillingViewModel, InvoiceRow } from "@/types/buyerDashboard";
import { toast } from "sonner";

const csvEscape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function BuyerBillingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<BuyerBillingViewModel | null>(null);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getBuyerBillingView(currentUser.uid)
      .then(setView)
      .catch((error) => {
        console.error("Failed to load buyer billing", error);
        toast.error("Unable to load billing details right now.");
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const filteredInvoices = useMemo(() => {
    if (!view) return [];
    if (invoiceStatusFilter === "all") return view.invoices;
    return view.invoices.filter((row) => row.status === invoiceStatusFilter);
  }, [view, invoiceStatusFilter]);

  const exportInvoicesCsv = () => {
    const rows = filteredInvoices;
    if (!rows.length) {
      toast.info("No invoices to export.");
      return;
    }

    const header = ["Invoice #", "Date", "Amount KES", "Status"];
    const body = rows.map((row) => [row.invoiceNumber, row.dateLabel, row.amountKes, row.status]);
    const content = [header, ...body].map((line) => line.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `buyer-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = (row: InvoiceRow) => {
    if (row.downloadUrl) {
      window.open(row.downloadUrl, "_blank", "noopener,noreferrer");
      return;
    }
    toast.info("Invoice download will be available soon.");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <BuyerSkeletonBlocks />
      </div>
    );
  }

  if (!view) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <BuyerTableEmptyState
          title="Billing unavailable"
          description="Please sign in again to view billing details."
          ctaLabel="Go to login"
          onClick={() => navigate("/login")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      <header className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-muted-foreground">Invoices, transactions, plan usage, and payment methods.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.info("Upgrade flow coming soon.")}>Upgrade plan</Button>
            <Button variant="outline" onClick={exportInvoicesCsv}>Export CSV</Button>
          </div>
        </div>
      </header>

      <Card className="border-border/60">
        <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Info label="Plan" value={view.currentPlan.name} />
          <Info label="Renewal" value={view.currentPlan.renewalDate || "Not scheduled"} />
          <Info label="Trial" value={view.currentPlan.trialEndsAt || "N/A"} />
          <Info label="Payment method" value={view.currentPlan.paymentSummary || "Not configured"} />
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices & Receipts</CardTitle>
          <div className="flex w-full max-w-xs gap-2">
            <Input
              value={invoiceStatusFilter}
              onChange={(event) => setInvoiceStatusFilter(event.target.value || "all")}
              placeholder="all | paid | pending"
            />
            <Button variant="outline" onClick={() => setInvoiceStatusFilter("all")}>Reset</Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length ? (
            <BuyerInvoiceTable rows={filteredInvoices} onDownload={downloadInvoice} />
          ) : (
            <BuyerTableEmptyState title="No invoices yet" description="Invoices and receipts will appear after billing events." />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
        <CardContent>
          {view.transactions.length ? (
            <BuyerTransactionTable rows={view.transactions} />
          ) : (
            <BuyerTableEmptyState title="No transactions yet" description="Payments and fees will appear here once activity starts." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader><CardTitle>Usage & Fees</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {view.usageFees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{fee.label}</p>
                  {fee.hint ? <p className="text-xs text-muted-foreground">{fee.hint}</p> : null}
                </div>
                <p className="font-semibold">KES {fee.amountKes.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {view.paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <p className="font-medium">{method.label}</p>
                  <p className="text-xs uppercase text-muted-foreground">{method.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  {method.isDefault ? <Badge variant="verified">Default</Badge> : null}
                  <Badge variant="outline" className="capitalize">{method.status}</Badge>
                </div>
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={() => toast.info("M-Pesa setup coming soon.")}>Setup M-Pesa</Button>
              <Button variant="outline" onClick={() => toast.info("Card setup coming soon.")}>Setup Card</Button>
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <Label className="mb-2 block">Billing Address (International buyers)</Label>
              <Input placeholder="Address, city, country" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle>Admin / Team Billing</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Seats in use: {view.teamBilling.seatCount}</p>
            <p className="text-sm text-muted-foreground">Manage seat access and billing responsibilities.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => toast.info("Add seat flow coming soon.")}>Add seats</Button>
            <Button variant="outline" onClick={() => navigate("/buyer/profile")}>Roles & permissions</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
