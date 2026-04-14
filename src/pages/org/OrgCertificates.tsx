import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUserAccount } from "@/hooks/useUserAccount";
import { db } from "@/lib/firebase";
import { Award, Download, FileText, Search, Users } from "lucide-react";

export default function OrgCertificates() {
  const accountQuery = useUserAccount();
  const orgId = accountQuery.data?.orgId ?? "";
  const [certificates, setCertificates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const issuedCertificates = useMemo(() => certificates.filter((cert) => cert.status === "issued"), [certificates]);
  const uniqueMembers = useMemo(() => new Set(certificates.map((cert) => cert.memberUid || cert.memberId)).size, [certificates]);
  const uniqueTrainings = useMemo(() => new Set(certificates.map((cert) => cert.trainingId)).size, [certificates]);

  useEffect(() => {
    const loadCerts = async () => {
      if (!orgId) return;
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "orgs", orgId, "certificates"));
        setCertificates(snap.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) })));
      } catch (error) {
        setCertificates([]);
      } finally {
        setLoading(false);
      }
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{certificates.length}</p>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{issuedCertificates.length}</p>
                <p className="text-sm text-muted-foreground">Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueMembers}</p>
                <p className="text-sm text-muted-foreground">Certified Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueTrainings}</p>
                <p className="text-sm text-muted-foreground">Training Programs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Certificate Gallery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by member ID, training, or certificate number" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading certificates...</p>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                {search ? "No certificates match your search." : "No certificates issued yet."}
              </p>
              <p className="text-xs text-muted-foreground">
                Certificates are automatically generated when members pass training assessments.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((cert) => (
                <Card key={cert.id} className="border-border/60 transition-shadow hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={cert.status === "issued" ? "default" : "secondary"}>
                        {cert.status || "issued"}
                      </Badge>
                    </div>
                    <h3 className="mb-2 font-semibold line-clamp-2">{cert.trainingTitle || "Training Certificate"}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Member: {cert.memberId || cert.memberUid || "Unknown"}</p>
                      <p>Certificate: {cert.certificateNumber || "N/A"}</p>
                      {cert.score !== undefined && <p>Score: {cert.score}%</p>}
                      {cert.issuedAt && (
                        <p>Issued: {new Date(cert.issuedAt?.toDate?.() || cert.issuedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    {cert.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                        asChild
                      >
                        <a href={cert.pdfUrl} target="_blank" rel="noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
