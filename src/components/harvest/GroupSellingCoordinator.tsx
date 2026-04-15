import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, CheckCircle2, Clock, Truck, TrendingUp, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatKsh } from "@/lib/currency";
import { toast } from "sonner";

interface GroupMember {
  id: string;
  name: string;
  phone: string;
  quantityKg: number;
  committed: boolean;
}

interface GroupSale {
  id: string;
  cropName: string;
  targetQuantityKg: number;
  pricePerKg: number;
  buyer: string;
  deliveryDate: string;
  members: GroupMember[];
  status: "forming" | "ready" | "delivered";
}

const SAMPLE_GROUP: GroupSale = {
  id: "g1",
  cropName: "Tomatoes",
  targetQuantityKg: 1000,
  pricePerKg: 68,
  buyer: "Fresh Mart Kenya",
  deliveryDate: "2025-01-25",
  status: "forming",
  members: [
    { id: "m1", name: "John Kamau (You)",  phone: "+254712345678", quantityKg: 300, committed: true  },
    { id: "m2", name: "Mary Wanjiku",      phone: "+254723456789", quantityKg: 250, committed: true  },
    { id: "m3", name: "Peter Mwangi",      phone: "+254734567890", quantityKg: 200, committed: true  },
    { id: "m4", name: "Grace Njeri",       phone: "+254745678901", quantityKg: 150, committed: false },
    { id: "m5", name: "David Ochieng",     phone: "+254756789012", quantityKg: 100, committed: false },
  ],
};

export function GroupSellingCoordinator({ cropName = "Tomatoes", myQuantityKg = 300 }: { cropName?: string; myQuantityKg?: number }) {
  const [group, setGroup] = useState<GroupSale>(SAMPLE_GROUP);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newQty, setNewQty] = useState("");

  const committed = group.members.filter((m) => m.committed);
  const committedQty = committed.reduce((s, m) => s + m.quantityKg, 0);
  const totalQty = group.members.reduce((s, m) => s + m.quantityKg, 0);
  const coveragePct = Math.round((committedQty / group.targetQuantityKg) * 100);
  const isReady = committedQty >= group.targetQuantityKg;
  const totalRevenue = committedQty * group.pricePerKg;
  const transportSaving = Math.round(committedQty * 3); // ~KES 3/kg saving vs individual

  const addMember = () => {
    if (!newName || !newQty) { toast.error("Enter name and quantity"); return; }
    setGroup((p) => ({
      ...p,
      members: [...p.members, {
        id: `m${Date.now()}`,
        name: newName,
        phone: newPhone,
        quantityKg: parseFloat(newQty),
        committed: false,
      }],
    }));
    setNewName(""); setNewPhone(""); setNewQty("");
    toast.success(`${newName} added to group`);
  };

  const toggleCommit = (id: string) => {
    setGroup((p) => ({
      ...p,
      members: p.members.map((m) => m.id === id ? { ...m, committed: !m.committed } : m),
    }));
  };

  const shareInvite = () => {
    const text = `🌱 Group sale for ${group.cropName}!\n\nBuyer: ${group.buyer}\nPrice: KES ${group.pricePerKg}/kg\nDelivery: ${group.deliveryDate}\nTarget: ${group.targetQuantityKg} kg\n\nJoin us to get a better price and share transport costs. Reply to confirm your quantity.\n\n— AgriSmart Group Sale`;
    if (navigator.share) {
      navigator.share({ title: "Group Sale Invite", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast.success("Invite copied to clipboard"));
    }
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-info/10">
              <Users className="h-3.5 w-3.5 text-info" />
            </div>
            <CardTitle className="text-base">Group Selling Coordinator</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border text-xs",
              isReady ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"
            )}>
              {isReady ? "Ready to sell" : `${coveragePct}% filled`}
            </Badge>
            <Badge variant="outline" className="text-[10px]">Sample data</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Pool harvest with cooperative members to meet minimum order quantities and share transport
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Group sale details */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{group.buyer}</p>
              <p className="text-xs text-muted-foreground">Wants {group.targetQuantityKg} kg of {group.cropName} by {group.deliveryDate}</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-success">{formatKsh(group.pricePerKg)}/kg</p>
              <p className="text-[10px] text-muted-foreground">agreed price</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Target",    value: `${group.targetQuantityKg} kg` },
              { label: "Committed", value: `${committedQty} kg`           },
              { label: "Revenue",   value: formatKsh(totalRevenue)         },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-background/70 p-2">
                <p className="text-xs font-semibold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{committedQty} / {group.targetQuantityKg} kg committed</span>
            <span className={cn("font-medium", isReady ? "text-success" : "text-warning")}>{coveragePct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", isReady ? "bg-success" : "bg-warning")}
              style={{ width: `${Math.min(coveragePct, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Truck className="h-3 w-3" />
            Shared transport saves ~{formatKsh(transportSaving)} vs individual delivery
          </p>
        </div>

        {/* Members */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Members ({group.members.length}) · {committed.length} committed
          </p>
          {group.members.map((member) => (
            <div key={member.id} className={cn(
              "flex items-center gap-3 rounded-xl border p-2.5 transition-all",
              member.committed ? "border-success/30 bg-success/5" : "border-border/60 bg-background/60"
            )}>
              <button
                type="button"
                onClick={() => toggleCommit(member.id)}
                className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                  member.committed ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"
                )}
              >
                {member.committed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{member.name}</p>
                {member.phone && <p className="text-[10px] text-muted-foreground">{member.phone}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground">{member.quantityKg} kg</p>
                <p className="text-[10px] text-muted-foreground">{formatKsh(member.quantityKg * group.pricePerKg)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add member */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add member</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="h-7 text-xs" />
            <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+254..." className="h-7 text-xs" />
            <Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="Qty (kg)" className="h-7 text-xs" />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={addMember} className="h-7 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={shareInvite} className="h-7 gap-1 text-xs">
              <Share2 className="h-3.5 w-3.5" /> Share invite
            </Button>
          </div>
        </div>

        {isReady && (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 p-3">
            <TrendingUp className="h-4 w-4 text-success shrink-0" />
            <p className="text-xs text-muted-foreground">
              Group is ready! Contact <span className="font-medium text-foreground">{group.buyer}</span> to confirm the order and arrange delivery.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
