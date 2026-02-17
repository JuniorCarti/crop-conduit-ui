import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function BuyerVerificationPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Verification Pending</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your buyer account is pending SuperAdmin approval. You can browse Marketplace, but commit actions are locked until approval.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate("/marketplace")}>Browse Marketplace</Button>
          <Button variant="outline" onClick={() => navigate("/buyer/profile")}>Open Profile</Button>
          <Button onClick={() => navigate("/buyer/dashboard")}>Go to Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}
