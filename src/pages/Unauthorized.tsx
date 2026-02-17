import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type UnauthorizedState = {
  from?: string;
  fallbackTo?: string;
  fallbackLabel?: string;
};

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as UnauthorizedState;

  const fallbackTo = useMemo(() => state.fallbackTo || "/", [state.fallbackTo]);
  const fallbackLabel = useMemo(() => {
    if (state.fallbackLabel) return state.fallbackLabel;
    if (fallbackTo === "/registration") return "Complete registration";
    if (fallbackTo.startsWith("/org")) return "Go to Org Portal";
    if (fallbackTo.startsWith("/gov")) return "Go to Government Portal";
    if (fallbackTo.startsWith("/marketplace")) return "Go to Marketplace";
    return "Go back";
  }, [fallbackTo, state.fallbackLabel]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="space-y-2">
          <div className="flex justify-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
          <CardTitle className="text-center text-xl">Unauthorized</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            You do not have permission to access this page.
          </p>
          {state.from ? (
            <p className="text-xs text-muted-foreground">Requested: {state.from}</p>
          ) : null}
          <Button onClick={() => navigate(fallbackTo, { replace: true })}>{fallbackLabel}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
