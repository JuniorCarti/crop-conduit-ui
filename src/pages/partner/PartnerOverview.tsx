import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserAccount } from "@/hooks/useUserAccount";

export default function PartnerOverview() {
  const account = useUserAccount();
  return (
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-1">
        <p>Role: {account.data?.role ?? "--"}</p>
        <p>Partner ID: {(account.data as any)?.partnerId ?? "--"}</p>
      </CardContent>
    </Card>
  );
}

