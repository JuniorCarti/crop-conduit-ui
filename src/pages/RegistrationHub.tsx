import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, ShoppingCart, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCardShell } from "@/components/landing/AuthCardShell";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { LandingShell } from "@/components/landing/LandingShell";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useUserRole } from "@/hooks/useUserRole";
import { AgriSmartLogo } from "@/components/Brand/AgriSmartLogo";

const cards = [
  {
    key: "farmer",
    title: "Farmer Registration",
    description: "For growers who need climate, crop, and harvest guidance.",
    icon: Sprout,
    route: "/farmer-registration",
  },
  {
    key: "buyer",
    title: "Buyer Registration",
    description: "For traders, retailers, and offtakers sourcing produce.",
    icon: ShoppingCart,
    route: "/buyer-registration",
  },
  {
    key: "org",
    title: "Organization Registration",
    description: "For cooperatives, enterprises, banks, and NGOs managing members.",
    icon: Building2,
    route: "/org-registration",
  },
] as const;

export default function RegistrationHub() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { role } = useUserRole();
  const [completed, setCompleted] = useState<{ farmer: boolean; buyer: boolean; org: boolean }>({
    farmer: false,
    buyer: false,
    org: false,
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const load = async () => {
      const [farmerSnap, buyerSnap, userSnap] = await Promise.all([
        getDoc(doc(db, "farmers", currentUser.uid)),
        getDoc(doc(db, "buyerProfiles", currentUser.uid)),
        getDoc(doc(db, "users", currentUser.uid)),
      ]);

      const userRole = userSnap.exists() ? (userSnap.data()?.role as string) : "";
      setCompleted({
        farmer: farmerSnap.exists(),
        buyer: buyerSnap.exists(),
        org: userRole === "org_admin" || userRole === "org_staff" || role === "org_admin" || role === "org_staff",
      });
    };

    load();
  }, [currentUser?.uid, role]);

  const backLabel = useMemo(() => (currentUser ? "Back to Profile" : "Back to Home"), [currentUser]);
  const backRoute = currentUser ? "/profile" : "/";

  return (
    <LandingShell
      hero={
        <HeroPanel>
          <div className="inline-flex w-fit rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur">
            <AgriSmartLogo variant="inline" size="sm" showTagline={false} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl whitespace-normal break-words">
              Choose your registration path.
            </h1>
            <p className="max-w-xl text-base text-foreground/70 sm:text-lg whitespace-normal break-words leading-relaxed">
              Pick the account type that matches your role so we can tailor your experience.
            </p>
          </div>
        </HeroPanel>
      }
      card={
        <AuthCardShell id="registration-hub">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">Complete your registration</h2>
            <p className="text-sm text-muted-foreground">
              Select a registration type to continue.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {cards.map((card) => {
              const isCompleted = completed[card.key];
              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => !isCompleted && navigate(card.route)}
                  disabled={isCompleted}
                  className={`w-full rounded-2xl border bg-background/80 p-4 text-left shadow-sm transition ${
                    isCompleted
                      ? "border-success/40 opacity-70"
                      : "border-border hover:border-primary/50 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <card.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-base font-semibold text-foreground">{card.title}</p>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-4 w-4" />
                            Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{card.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <Button variant="ghost" className="text-sm" onClick={() => navigate(backRoute)}>
              {backLabel}
            </Button>
          </div>
        </AuthCardShell>
      }
    />
  );
}
