import { useEffect, useState } from "react";
import { doc, getDocs, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "orgs"));
      const rows = snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
      setOrgs(rows);
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SuperAdmin Verification</h1>
          <p className="text-sm text-muted-foreground">Review and approve organizations.</p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
