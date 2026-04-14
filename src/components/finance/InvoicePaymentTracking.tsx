/**
 * Invoice & Payment Tracking Component (UI Mockup)
 * Automated invoicing, payment reminders, and receivables management
 */

import { FileText, Clock, CheckCircle2, AlertCircle, Send, Download, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatKsh } from "@/lib/currency";

const invoices = [
  {
    id: "INV-2024-001",
    buyer: "Naivas Supermarket",
    amount: 125000,
    issued: "2024-01-15",
    due: "2024-02-14",
    status: "paid",
    paidDate: "2024-01-28",
    items: "Tomatoes (500kg), Onions (300kg)",
  },
  {
    id: "INV-2024-002",
    buyer: "Carrefour Kenya",
    amount: 89500,
    issued: "2024-01-20",
    due: "2024-02-19",
    status: "pending",
    paidDate: null,
    items: "Cabbage (400kg), Carrots (200kg)",
    daysOverdue: 0,
  },
  {
    id: "INV-2024-003",
    buyer: "Quickmart",
    amount: 45000,
    issued: "2024-01-10",
    due: "2024-02-09",
    status: "overdue",
    paidDate: null,
    items: "Spinach (150kg), Kale (100kg)",
    daysOverdue: 5,
  },
  {
    id: "INV-2024-004",
    buyer: "Chandarana Foodplus",
    amount: 67800,
    issued: "2024-01-22",
    due: "2024-02-21",
    status: "pending",
    paidDate: null,
    items: "Potatoes (600kg)",
    daysOverdue: 0,
  },
];

const paymentSummary = {
  totalOutstanding: 202300,
  totalPaid: 125000,
  totalOverdue: 45000,
  averagePaymentDays: 13,
};

const upcomingPayments = [
  { buyer: "Carrefour Kenya", amount: 89500, dueIn: 3 },
  { buyer: "Chandarana Foodplus", amount: 67800, dueIn: 7 },
  { buyer: "Naivas Supermarket", amount: 95000, dueIn: 12 },
];

export function InvoicePaymentTracking() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice & Payment Tracking
            </CardTitle>
            <CardDescription>
              Automated invoicing, payment reminders, and receivables
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </div>
            <p className="text-lg font-bold text-foreground">{formatKsh(paymentSummary.totalOutstanding)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-xs text-muted-foreground">Paid</p>
            </div>
            <p className="text-lg font-bold text-success">{formatKsh(paymentSummary.totalPaid)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
            <p className="text-lg font-bold text-destructive">{formatKsh(paymentSummary.totalOverdue)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-info" />
              <p className="text-xs text-muted-foreground">Avg Days</p>
            </div>
            <p className="text-lg font-bold text-foreground">{paymentSummary.averagePaymentDays} days</p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Invoices</h3>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="border border-border/60 rounded-lg p-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{invoice.id}</p>
                    <p className="text-xs text-muted-foreground">{invoice.buyer}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      invoice.status === "paid"
                        ? "bg-success/10 text-success"
                        : invoice.status === "overdue"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {invoice.status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {invoice.status === "overdue" && <AlertCircle className="h-3 w-3 mr-1" />}
                    {invoice.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {invoice.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{invoice.items}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatKsh(invoice.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Due: {invoice.due}
                      {invoice.status === "overdue" && (
                        <span className="text-destructive ml-1">({invoice.daysOverdue} days overdue)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">
                      <Download className="h-3 w-3" />
                    </Button>
                    {invoice.status !== "paid" && (
                      <Button size="sm" variant="ghost">
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                {invoice.paidDate && (
                  <div className="mt-2 bg-success/10 rounded-md p-2 text-xs text-success">
                    ✓ Paid on {invoice.paidDate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming Payments</h3>
          <div className="space-y-2">
            {upcomingPayments.map((payment, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{payment.buyer}</p>
                  <p className="text-xs text-muted-foreground">Due in {payment.dueIn} days</p>
                </div>
                <p className="text-sm font-bold text-foreground">{formatKsh(payment.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Collection Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Payment Collection Rate</p>
            <p className="text-sm font-bold text-foreground">73.5%</p>
          </div>
          <Progress value={73.5} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {formatKsh(paymentSummary.totalPaid)} collected of {formatKsh(paymentSummary.totalPaid + paymentSummary.totalOutstanding)} invoiced
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Send className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Automated reminders are sent 3 days before due date and every 2 days after. Invoices can be paid via M-Pesa, bank transfer, or AgriSmart Wallet.
        </div>
      </CardContent>
    </Card>
  );
}
