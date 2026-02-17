import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/StatusPill";
import type { TradeRow } from "@/components/org/trade/types";

const statusMeta = (status: TradeRow["status"]) => {
  if (status === "paid") return { label: "Paid", variant: "active" as const };
  if (status === "in_transit") return { label: "In Transit", variant: "pending" as const };
  if (status === "delivered") return { label: "Delivered", variant: "active" as const };
  return { label: "Pending", variant: "pending" as const };
};

export function TradeTable({
  rows,
  onSelect,
}: {
  rows: TradeRow[];
  onSelect: (row: TradeRow) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Crop</TableHead>
          <TableHead>Buyer</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Agreed price</TableHead>
          <TableHead>Delivery date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={6}>No trades yet.</TableCell></TableRow>
        ) : rows.map((row) => {
          const status = statusMeta(row.status);
          return (
            <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onSelect(row)}>
              <TableCell className="font-medium">{row.crop}</TableCell>
              <TableCell>{row.buyer}</TableCell>
              <TableCell>{row.quantityKg.toLocaleString()} kg</TableCell>
              <TableCell>KES {row.agreedPrice.toLocaleString()}</TableCell>
              <TableCell>{row.deliveryDate}</TableCell>
              <TableCell><StatusPill label={status.label} variant={status.variant} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
