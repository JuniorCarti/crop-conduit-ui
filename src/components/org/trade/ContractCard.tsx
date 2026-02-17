import { CalendarRange, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/shared/StatusPill";
import type { ContractRow } from "@/components/org/trade/types";

const toStatus = (status: ContractRow["status"]) => {
  if (status === "accepted") return { label: "Accepted", variant: "active" as const };
  if (status === "declined") return { label: "Declined", variant: "rejected" as const };
  return { label: "Pending", variant: "pending" as const };
};

export function ContractCard({
  contract,
  onAccept,
  onDecline,
  onView,
}: {
  contract: ContractRow;
  onAccept: (row: ContractRow) => void;
  onDecline: (row: ContractRow) => void;
  onView: (row: ContractRow) => void;
}) {
  const status = toStatus(contract.status);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{contract.crop}</CardTitle>
          <StatusPill label={status.label} variant={status.variant} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p><span className="text-muted-foreground">Locked price:</span> KES {contract.lockedPrice.toLocaleString()} /kg</p>
        <p><span className="text-muted-foreground">Quantity:</span> {contract.quantityKg.toLocaleString()} kg</p>
        <p className="flex items-center gap-2"><CalendarRange className="h-3.5 w-3.5 text-muted-foreground" /> {contract.deliveryWindow}</p>
        <p className="inline-flex items-center gap-1"><Handshake className="h-3.5 w-3.5 text-muted-foreground" /> {contract.buyer}</p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(contract)}>View details</Button>
        <Button size="sm" onClick={() => onAccept(contract)} disabled={contract.status !== "pending"}>Accept</Button>
        <Button size="sm" variant="outline" onClick={() => onDecline(contract)} disabled={contract.status !== "pending"}>Decline</Button>
      </CardFooter>
    </Card>
  );
}
