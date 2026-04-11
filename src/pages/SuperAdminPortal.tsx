import { useEffect, useState } from "react";
import { doc, getDocs, collection, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OrgRecord {
  id: string;
  orgName?: string;
  orgType?: string;
  county?: string;
  verificationStatus?: string;
  createdAt?: any;
}

interface TransportCompanyRecord {
  id: string;
  companyName?: string;
  contactPhone?: string;
  county?: string;
  approvalStatus?: string;
  createdAt?: any;
}

export default function SuperAdminPortal() {
  const { currentUser } = useAuth();
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<TransportCompanyRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"orgs" | "buyers" | "transport">("orgs");
  const [loading, setLoading] = useState(true);
  const [processingBuyerUid, setProcessingBuyerUid] = useState<string | null>(null);
  const [buyerError, setBuyerError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [orgSnap, buyerSnap, transportSnap] = await Promise.all([
          getDocs(collection(db, "orgs")),
          getDocs(collection(db, "buyers")),
          getDocs(collection(db, "transportCompanies")),
        ]);
        const rows = orgSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
        setOrgs(rows);
        const buyerRows = buyerSnap.docs.map((docSnap) => ({ uid: docSnap.id, ...(docSnap.data() as any) }));
        setBuyers(buyerRows);
        setBuyerError(null);
        const transportRows = transportSnap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
        setTransportCompanies(transportRows);
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
    setOrgs((prev) => prev.map((org) => org.id === orgId ? { ...org, verificationStatus: status } : org));
  };

  const approveBuyer = async (uid: string) => {
    try {
      setProcessingBuyerUid(uid);
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        approvalStatus: "APPROVED",
        verifiedBuyer: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentUser?.uid ?? "superadmin",
      });
      batch.update(doc(db, "buyerProfiles", uid), {
        approvalStatus: "APPROVED",
        verifiedBuyer: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentUser?.uid ?? "superadmin",
      });
      batch.update(doc(db, "buyers", uid), {
        approvalStatus: "APPROVED",
        verifiedBuyer: true,
        verifiedAt: serverTimestamp(),
        verifiedBy: currentUser?.uid ?? "superadmin",
      });
      await batch.commit();
      setBuyers((prev) => prev.map((b) => b.uid === uid ? { ...b, approvalStatus: "APPROVED" } : b));
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
      const batch = writeBatch(db);
      batch.update(doc(db, "users", uid), {
        approvalStatus: "REJECTED",
        verifiedBuyer: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid ?? "superadmin",
      });
      batch.update(doc(db, "buyerProfiles", uid), {
        approvalStatus: "REJECTED",
        verifiedBuyer: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid ?? "superadmin",
      });
      batch.update(doc(db, "buyers", uid), {
        approvalStatus: "REJECTED",
        verifiedBuyer: false,
        rejectionReason: reason,
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.uid ?? "superadmin",
      });
      await batch.commit();
      setBuyers((prev) => prev.map((b) => b.uid === uid ? { ...b, approvalStatus: "REJECTED" } : b));
      toast.success("Buyer rejected.");
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject buyer.");
    } finally {
      setProcessingBuyerUid(null);
    }
  };

  const updateTransportStatus = async (companyId: string, status: "approved" | "rejected") => {
    const reason = status === "rejected" ? window.prompt("Rejection reason") : null;
    await updateDoc(doc(db, "transportCompanies", companyId), {
      approvalStatus: status,
      verifiedAt: status === "approved" ? serverTimestamp() : null,
      verifiedBy: status === "approved" ? (currentUser?.uid ?? "superadmin") : null,
      rejectionReason: status === "rejected" ? reason || "Not specified" : null,
    });
    setTransportCompanies((prev) =>
      prev.map((company) =>
        company.id === companyId ? { ...company, approvalStatus: status } : company
      )
    );
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
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === "transport" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("transport")}
          >
            Transport Approvals
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
                {orgs.length === 0 ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={6}>No organizations found.</td></tr>
                ) : orgs.map((org) => {
                  const status = String(org.verificationStatus || "pending").toLowerCase();
                  return (
                    <tr key={org.id} className="border-t border-border">
                      <td className="p-3">{org.orgName || org.id}</td>
                      <td className="p-3">{org.orgType || "-"}</td>
                      <td className="p-3">{org.county || "-"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={status === "approved" ? "bg-green-100 text-green-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}>
                          {status}
                        </Badge>
                      </td>
                      <td className="p-3">{org.createdAt?.toDate ? org.createdAt.toDate().toLocaleDateString() : "-"}</td>
                      <td className="p-3 flex gap-2">
                        {status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateStatus(org.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(org.id, "rejected")}>Reject</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : activeTab === "buyers" ? (
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
                {buyerError ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={6}>{buyerError}</td>
                  </tr>
                ) : buyers.length === 0 ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={6}>No buyers found.</td>
                  </tr>
                ) : (
                  buyers.map((buyer) => {
                    const status = String(buyer.approvalStatus || "PENDING").toUpperCase();
                    return (
                      <tr key={buyer.uid} className="border-t border-border">
                        <td className="p-3">{buyer.displayName || buyer.uid}</td>
                        <td className="p-3">{buyer.companyName || "-"}</td>
                        <td className="p-3">{buyer?.internationalLocation?.buyerCountry || buyer?.buyerCountry || "-"}</td>
                        <td className="p-3">{buyer.createdAt?.toDate ? buyer.createdAt.toDate().toLocaleDateString() : buyer.createdAt?.seconds ? new Date(buyer.createdAt.seconds * 1000).toLocaleDateString() : "-"}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className={status === "APPROVED" ? "bg-green-100 text-green-800" : status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}>
                            {status}
                          </Badge>
                        </td>
                        <td className="p-3 flex gap-2">
                          {status === "PENDING" && (
                            <>
                              <Button size="sm" disabled={processingBuyerUid === buyer.uid} onClick={() => approveBuyer(buyer.uid)}>Approve</Button>
                              <Button size="sm" variant="outline" disabled={processingBuyerUid === buyer.uid} onClick={() => rejectBuyer(buyer.uid)}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">County</th>
                  <th className="p-3 text-left">Phone</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transportCompanies.length === 0 ? (
                  <tr><td className="p-4 text-muted-foreground" colSpan={6}>No transport companies found.</td></tr>
                ) : transportCompanies.map((company) => {
                  const status = String(company.approvalStatus || "pending").toLowerCase();
                  return (
                    <tr key={company.id} className="border-t border-border">
                      <td className="p-3">{company.companyName || company.id}</td>
                      <td className="p-3">{company.county || "-"}</td>
                      <td className="p-3">{company.contactPhone || "-"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={status === "approved" ? "bg-green-100 text-green-800" : status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"}>
                          {status}
                        </Badge>
                      </td>
                      <td className="p-3">{company.createdAt?.toDate ? company.createdAt.toDate().toLocaleDateString() : "-"}</td>
                      <td className="p-3 flex gap-2">
                        {status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => updateTransportStatus(company.id, "approved")}>Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => updateTransportStatus(company.id, "rejected")}>Reject</Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
