import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";


export default function OrgCertificates() {
  const accountQuery = useUserAccount();
  const orgId = accountQuery.data?.orgId ?? "";
  const [certificates, setCertificates] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadCerts = async () => {
      if (!orgId) return;
      const snap = await getDocs(collection(db, "orgs", orgId, "certificates"));
      setCertificates(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
    };
    loadCerts().catch(() => setCertificates([]));
  }, [orgId]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return certificates;
    return certificates.filter((cert) =>
      String(cert.memberId ?? "").toLowerCase().includes(term) ||
      String(cert.trainingTitle ?? "").toLowerCase().includes(term) ||
      String(cert.certificateNumber ?? "").toLowerCase().includes(term)
    );
  }, [certificates, search]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Certificates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search by member ID, training, certificate" value={search} onChange={(e) => setSearch(e.target.value)} />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((cert) => (
                <div key={cert.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <p className="font-semibold text-foreground">{cert.trainingTitle || "Training"}</p>
                  <p className="text-xs text-muted-foreground">Member: {cert.memberId || cert.memberUid}</p>
                  <p className="text-xs text-muted-foreground">Certificate: {cert.certificateNumber}</p>
                  {cert.pdfUrl && (
                    <a
                      href={cert.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
