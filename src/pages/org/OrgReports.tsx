import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { createReportMetadata, listReportMetadata } from "@/services/phase3Service";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { uploadToR2WithKey } from "@/services/r2UploadService";

type ReportType = "members" | "seats" | "impact" | "sales" | "sponsorUtilization";

export default function OrgReports() {
  const account = useUserAccount();
  const orgId = account.data?.orgId ?? "";
  const uid = account.data?.uid ?? "";
  const canManage = account.data?.role === "org_admin" || account.data?.role === "org_staff" || account.data?.role === "admin";
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [type, setType] = useState<ReportType>("members");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const flags = await getOrgFeatureFlags(orgId);
      setEnabled(flags.phase3Reports === true);
      if (!flags.phase3Reports) {
        setRows([]);
        return;
      }
      setRows(await listReportMetadata(orgId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [orgId]);

  const toCsv = (headers: string[], rows: Array<Record<string, unknown>>) => {
    const escape = (value: unknown) => {
      const text = String(value ?? "");
      if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
        return `"${text.replace(/"/g, "\"\"")}"`;
      }
      return text;
    };
    const lines = [headers.join(",")];
    rows.forEach((row) => {
      lines.push(headers.map((header) => escape(row[header])).join(","));
    });
    return `${lines.join("\n")}\n`;
  };

  const buildReportRows = async (reportType: ReportType) => {
    if (!orgId) return { headers: [] as string[], rows: [] as Array<Record<string, unknown>> };

    if (reportType === "members" || reportType === "seats") {
      const snap = await getDocs(collection(db, "orgs", orgId, "members"));
      const rows = snap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          memberDocId: docSnap.id,
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          status: data.status ?? data.verificationStatus ?? "",
          seatType: data.seatType ?? data.seatStatus ?? data.premiumSeatType ?? "none",
          sponsorId: data.sponsorId ?? "",
          sponsorshipId: data.sponsorshipId ?? "",
        };
      });
      if (reportType === "members") {
        return {
          headers: ["memberDocId", "fullName", "phone", "status"],
          rows,
        };
      }
      return {
        headers: ["memberDocId", "fullName", "seatType", "sponsorId", "sponsorshipId", "status"],
        rows,
      };
    }

    if (reportType === "impact") {
      const snap = await getDocs(collection(db, "orgs", orgId, "impact"));
      const rows = snap.docs.map((docSnap) => ({ monthId: docSnap.id, ...(docSnap.data() as any) }));
      return {
        headers: [
          "monthId",
          "month",
          "activeMembers",
          "sponsoredMembers",
          "trainingsHeld",
          "attendanceCount",
          "groupSalesVolumeKg",
          "groupSalesValueKES",
          "avgFarmGatePriceDeltaKES",
          "estimatedPostHarvestLossReductionPct",
        ],
        rows,
      };
    }

    if (reportType === "sales") {
      const snap = await getDocs(collection(db, "orgs", orgId, "salesBatches"));
      const rows = snap.docs.map((docSnap) => ({ batchId: docSnap.id, ...(docSnap.data() as any) }));
      return {
        headers: [
          "batchId",
          "batchName",
          "commodity",
          "grade",
          "targetMarket",
          "targetPricePerKg",
          "status",
          "totalKg",
          "totalValueKES",
        ],
        rows,
      };
    }

    const sponsorshipsSnap = await getDocs(collection(db, "orgs", orgId, "sponsorships"));
    const rows = sponsorshipsSnap.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      const budget = Number(data.seatBudget ?? 0);
      const used = Number(data.seatsUsed ?? 0);
      return {
        sponsorshipId: docSnap.id,
        partnerId: data.partnerId ?? "",
        title: data.title ?? "",
        status: data.status ?? "",
        seatBudget: budget,
        seatsUsed: used,
        seatsRemaining: Math.max(0, budget - used),
      };
    });
    return {
      headers: ["sponsorshipId", "partnerId", "title", "status", "seatBudget", "seatsUsed", "seatsRemaining"],
      rows,
    };
  };

  const generateMeta = async () => {
    if (!orgId || !canManage) return;
    setSaving(true);
    try {
      const reportData = await buildReportRows(type);
      const csv = toCsv(reportData.headers, reportData.rows);
      const storagePath = `org_reports/${orgId}/${type}/${Date.now()}.csv`;
      const file = new File([csv], `${type}-${Date.now()}.csv`, { type: "text/csv" });
      const upload = await uploadToR2WithKey(file, storagePath);
      await createReportMetadata({
        orgId,
        type,
        storagePath,
        createdByUid: uid,
        filters: {
          rows: reportData.rows.length,
          generatedAt: new Date().toISOString(),
          downloadUrl: upload.url,
        },
      });
      toast.success(`Report exported (${reportData.rows.length} rows).`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate report.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading reports...</CardContent></Card>;
  if (!enabled) return <Phase3DisabledCard title="Reports" />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Generate CSV report</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:w-56">
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="members">members</SelectItem>
                <SelectItem value="seats">seats</SelectItem>
                <SelectItem value="impact">impact</SelectItem>
                <SelectItem value="sales">sales</SelectItem>
                <SelectItem value="sponsorUtilization">sponsorUtilization</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateMeta} disabled={!canManage || saving}>{saving ? "Generating..." : "Generate CSV"}</Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Report records</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded border border-border/60 p-3 text-sm">
                <p className="font-medium">{row.type}</p>
                <p className="text-xs text-muted-foreground">{row.storagePath || "--"}</p>
                {row.filters?.downloadUrl && (
                  <a
                    href={row.filters.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Download CSV
                  </a>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
