import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BUYER_TRADE_ENABLED, listBuyerWalletTransactions, type WalletTxnDoc } from "@/services/buyerTradeService";

const parseDate = (value: any) => {
  const date = value?.toDate?.() ?? (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "--";
};

const statusVariant = (status: WalletTxnDoc["status"]) => {
  if (status === "completed") return "default";
  if (status === "pending") return "secondary";
  return "outline";
};

export default function BuyerTradeWallet() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WalletTxnDoc[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);
    listBuyerWalletTransactions(currentUser.uid)
      .then(setRows)
      .catch((error: any) => {
        toast.error(error?.message || "Failed to load transactions.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  const summary = useMemo(() => {
    const totalDeposits = rows.filter((row) => row.type === "deposit").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const locked = rows.filter((row) => row.type === "deposit" && row.status === "pending").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const refundsPending = rows.filter((row) => row.type === "refund" && row.status === "pending").reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const completed = rows.filter((row) => row.status === "completed").length;
    return { totalDeposits, locked, refundsPending, completed };
  }, [rows]);

  if (!BUYER_TRADE_ENABLED) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle>Deposits & Transactions</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Buyer trade module is disabled.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Deposits & Transactions</h2>
        <p className="text-sm text-muted-foreground">Track deposits, refunds, and settlement records.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Total deposits paid</p><p className="text-2xl font-semibold">KES {summary.totalDeposits.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Active deposits locked</p><p className="text-2xl font-semibold">KES {summary.locked.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Refunds pending</p><p className="text-2xl font-semibold">KES {summary.refundsPending.toLocaleString()}</p></CardContent></Card>
        <Card className="border-border/60"><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Completed transactions</p><p className="text-2xl font-semibold">{summary.completed}</p></CardContent></Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}>Loading transactions...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={6}>No transactions yet.</TableCell></TableRow>
              ) : rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{parseDate(row.createdAt)}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>KES {Number(row.amount || 0).toLocaleString()}</TableCell>
                  <TableCell><Badge variant={statusVariant(row.status)}>{row.status}</Badge></TableCell>
                  <TableCell>{row.reference || "--"}</TableCell>
                  <TableCell>{row.method || "M-PESA (placeholder)"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
