import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function GovUnderReview() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-xl w-full border-border/60">
        <CardHeader>
          <CardTitle>Your Government Application Is Under Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            The national government portal will be available once SuperAdmin approves your organization profile.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/org/profile")}>View Organization Profile</Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>Back to profile</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

