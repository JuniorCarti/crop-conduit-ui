import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

const accessByRole: Record<string, { allowed: string[]; blocked: string[]; next: string }> = {
  farmer: {
    allowed: ["Dashboard", "Market Oracle", "Climate", "Asha", "Harvest", "Profile"],
    blocked: ["Org Portal", "SuperAdmin Portal"],
    next: "/",
  },
  buyer: {
    allowed: ["Marketplace", "Profile", "Community"],
    blocked: ["Climate", "Harvest", "Advisory", "Org Portal"],
    next: "/marketplace",
  },
  org_admin: {
    allowed: ["Org Portal", "Members", "Profile"],
    blocked: ["Climate", "Harvest", "Advisory"],
    next: "/org",
  },
  org_staff: {
    allowed: ["Org Portal", "Members", "Profile"],
    blocked: ["Climate", "Harvest", "Advisory"],
    next: "/org",
  },
  superadmin: {
    allowed: ["SuperAdmin Portal", "Profile"],
    blocked: ["Climate", "Harvest", "Marketplace", "Org Portal"],
    next: "/superadmin",
  },
  admin: {
    allowed: ["Admin Portal", "Profile"],
    blocked: ["Climate", "Harvest", "Marketplace"],
    next: "/admin",
  },
};

export default function AccessSummary() {
  const navigate = useNavigate();
  const { role } = useUserRole();

  const summary = useMemo(() => accessByRole[role] || accessByRole.farmer, [role]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/95 p-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Your account is ready</h1>
          <p className="text-sm text-muted-foreground">Role: {role}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/5 p-4">
            <p className="text-sm font-semibold text-success">You can access</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {summary.allowed.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive">Not available</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {summary.blocked.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button onClick={() => navigate(summary.next)}>Continue</Button>
        </div>
      </div>
    </div>
  );
}
