import { useEffect, useState } from "react";
import { doc, getDocs, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { adminApproveBuyer, adminListBuyers, adminRejectBuyer } from "@/services/buyerAccountService";
import { toast } from "sonner";

interface OrgRecord {
  id: string;
  orgName?: string;
  orgType?: string;
  county?: string;
  verificationStatus?: string;
  createdAt?: any;
}

export default function SuperAdminPortal() {
  const { currentUser } = useAuth();
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"orgs" | "buyers">("orgs");
  const [loading, setLoading] = useState(true);
  const [processingBuyerUid, setProcessingBuyerUid] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [orgSnap, buyerData] = await Promise.all([
          getDocs(collection(db, "orgs")),
          adminListBuyers("PENDING"),
        ]);
        const rows = orgSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
        setOrgs(rows);
        setBuyers(Array.isArray(buyerData?.data?.items) ? buyerData.data.items : Array.isArray(buyerData?.items) ? buyerData.items : []);
      } catch (error: any) {
        console.error("Failed to load superadmin data", error);
        toast.error(error?.message || "Failed to load verification data.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateStatus = async (orgId: string, status: "approved" | "rejected") => {
    const reason = status === "rejected" ? window.prompt("Rejection reason") : null;
    await updateDoc(doc(db, "orgs", orgId), {
      verificationStatus: status,
      verifiedAt: status === "approved" ? serverTimestamp() : null,
      verifiedBy: status === "approved" ? (currentUser?.uid ?? "superadmin") : null,
      rejectionReason: status === "rejected" ? reason || "Not specified" : null,
    });
    setOrgs((prev) =>
      prev.map((org) =>
        org.id === orgId
          ? { ...org, verificationStatus: status }
          : org
      )
    );
  };

  const approveBuyer = async (uid: string) => {
    try {
      setProcessingBuyerUid(uid);
      await adminApproveBuyer(uid);
      setBuyers((prev) => prev.filter((buyer) => buyer.uid !== uid));
      toast.success("Buyer approved.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve buyer.");
    } finally {
      setProcessingBuyerUid(null);
    }
  };

  const rejectBuyer = async (uid: string) => {
    const reason = window.prompt("Rejection reason");
    if (!reason) return;
    try {
      setProcessingBuyerUid(uid);
      await adminRejectBuyer(uid, reason);
      setBuyers((prev) => prev.filter((buyer) => buyer.uid !== uid));
      toast.success("Buyer rejected.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject buyer.");
    } finally {
      setProcessingBuyerUid(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SuperAdmin Verification</h1>
          <p className="text-sm text-muted-foreground">Review and approve organizations and buyers.</p>
        </div>

        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === "orgs" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("orgs")}
          >
            Organization Approvals
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === "buyers" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("buyers")}
          >
            Buyer Approvals
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : activeTab === "orgs" ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">County</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => (
                  <tr key={org.id} className="border-t border-border">
                    <td className="p-3">{org.orgName || org.id}</td>
                    <td className="p-3">{org.orgType || "-"}</td>
                    <td className="p-3">{org.county || "-"}</td>
                    <td className="p-3 capitalize">{org.verificationStatus || "pending"}</td>
                    <td className="p-3">
                      {org.createdAt?.toDate ? org.createdAt.toDate().toLocaleDateString() : "-"}
                    </td>
                    <td className="p-3 flex gap-2">
                      <Button size="sm" onClick={() => updateStatus(org.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(org.id, "rejected")}>
                        Reject
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Country</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.length === 0 ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={6}>No pending buyers.</td>
                  </tr>
                ) : (
                  buyers.map((buyer) => (
                    <tr key={buyer.uid} className="border-t border-border">
                      <td className="p-3">{buyer.displayName || buyer.uid}</td>
                      <td className="p-3">{buyer.companyName || "-"}</td>
                      <td className="p-3">{buyer?.company?.country || "-"}</td>
                      <td className="p-3">{buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                          {buyer.approvalStatus || "PENDING"}
                        </Badge>
                      </td>
                      <td className="p-3 flex gap-2">
                        <Button size="sm" disabled={processingBuyerUid === buyer.uid} onClick={() => approveBuyer(buyer.uid)}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingBuyerUid === buyer.uid}
                          onClick={() => rejectBuyer(buyer.uid)}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
