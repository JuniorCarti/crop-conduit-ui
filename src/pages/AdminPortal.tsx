import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPortal() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Platform Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Admin tools placeholder.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
