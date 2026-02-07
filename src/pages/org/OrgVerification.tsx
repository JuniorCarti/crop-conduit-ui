import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OrgVerification() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">Registration certificate</p>
        <p className="text-sm text-muted-foreground">KRA PIN</p>
        <p className="text-sm text-muted-foreground">Business permit</p>
        <p className="text-sm text-muted-foreground">Tax compliance</p>
        <p className="text-xs text-muted-foreground">Uploads will be enabled soon.</p>
      </CardContent>
    </Card>
  );
}
