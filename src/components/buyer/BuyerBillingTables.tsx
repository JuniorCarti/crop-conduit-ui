import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceRow, TransactionRow } from "@/types/buyerDashboard";

type InvoiceProps = {
  rows: InvoiceRow[];
  onDownload: (row: InvoiceRow) => void;
};

export function BuyerInvoiceTable({ rows, onDownload }: InvoiceProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Download</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.invoiceNumber}</TableCell>
            <TableCell>{row.dateLabel}</TableCell>
            <TableCell>KES {row.amountKes.toLocaleString()}</TableCell>
            <TableCell><Badge variant="outline" className="capitalize">{row.status}</Badge></TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" onClick={() => onDownload(row)}>Download</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type TransactionProps = {
  rows: TransactionRow[];
};

export function BuyerTransactionTable({ rows }: TransactionProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>M-Pesa Receipt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.reference}</TableCell>
            <TableCell>{row.dateLabel}</TableCell>
            <TableCell className="capitalize">{row.type}</TableCell>
            <TableCell>KES {row.amountKes.toLocaleString()}</TableCell>
            <TableCell className="uppercase">{row.method}</TableCell>
            <TableCell><Badge variant="outline" className="capitalize">{row.status}</Badge></TableCell>
            <TableCell>{row.mpesaReceipt || "--"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
