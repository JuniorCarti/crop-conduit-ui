import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserAccount } from "@/hooks/useUserAccount";
import { listPartnerSponsorships } from "@/services/phase3Service";

export default function PartnerSponsorships() {
  const account = useUserAccount();
  const partnerId = (account.data as any)?.partnerId ?? "";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setRows([]);
      setLoading(false);
      return;
    }
    listPartnerSponsorships(partnerId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [partnerId]);

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading...</CardContent></Card>;

  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Sponsorships</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sponsorship contracts available.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded border border-border/60 p-3 text-sm">
              <p className="font-medium">{row.title || row.orgId}</p>
              <p className="text-xs text-muted-foreground">
                Org {row.orgId} • Status {row.status ?? "--"} • Used {Number(row.seatsUsed ?? 0)}/{Number(row.seatBudget ?? 0)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

