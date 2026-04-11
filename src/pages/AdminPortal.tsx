import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { upsertTransportCompany } from "@/services/transportService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ShieldCheck } from "lucide-react";
import type { TransportCompany } from "@/types/transport";

export default function AdminPortal() {
  const [companies, setCompanies] = useState<TransportCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "transportCompanies"),
      where("approvalStatus", "==", "pending"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCompanies(snap.docs.map((d) => ({ ...(d.data() as TransportCompany), id: d.id })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setActing(id);
    try {
      await upsertTransportCompany(id, { approvalStatus: status });
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Admin Portal" subtitle="Platform management" icon={ShieldCheck} />
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Transport company approvals</h3>
            <p className="text-sm text-muted-foreground">Review and approve or reject pending transport registrations.</p>
          </div>
          {loading ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">Loading...</CardContent>
            </Card>
          ) : companies.length === 0 ? (
            <Card className="border border-border/60">
              <CardContent className="py-6 text-sm text-muted-foreground">No pending transport registrations.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {companies.map((company) => (
                <Card key={company.id} className="border border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{company.companyName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{company.contactPhone} · {company.county || "—"}</p>
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">pending</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="font-semibold">{company.contactName || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fleet mode</p>
                        <p className="font-semibold capitalize">{company.fleetMode || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Service regions</p>
                        <p className="font-semibold">{company.serviceRegions?.join(", ") || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-semibold">{company.contactEmail || "—"}</p>
                      </div>
                    </div>
                    {company.notes && (
                      <p className="text-xs text-muted-foreground border-t border-border/40 pt-2">{company.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => company.id && updateStatus(company.id, "approved")}
                        disabled={acting === company.id}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => company.id && updateStatus(company.id, "rejected")}
                        disabled={acting === company.id}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
