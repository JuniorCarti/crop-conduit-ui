import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserAccount } from "@/hooks/useUserAccount";
import { getOrgFeatureFlags } from "@/services/orgFeaturesService";
import { createReportMetadata, listReportMetadata } from "@/services/phase3Service";
import { Phase3DisabledCard } from "@/components/org/Phase3DisabledCard";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { uploadToR2WithKey } from "@/services/r2UploadService";
import { FileText, Download, BarChart3, Users, TrendingUp } from "lucide-react";

type ReportType = "members" | "seats" | "impact" | "sales" | "sponsorUtilization";

const reportTemplates = [
  { value: "members", label: "Members Report", description: "Export all member data", icon: Users },
  { value: "seats", label: "Seats Report", description: "Seat assignments and sponsorships", icon: TrendingUp },
  { value: "impact", label: "Impact Report", description: "Monthly impact metrics", icon: BarChart3 },
  { value: "sales", label: "Sales Report", description: "Sales batches and revenue", icon: TrendingUp },
  { value: "sponsorUtilization", label: "Sponsor Utilization", description: "Sponsor pool usage", icon: Users },
];

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

  const recentReports = useMemo(() => rows.slice(0, 5), [rows]);
  const reportsByType = useMemo(() => {
    const grouped: Record<string, number> = {};
    rows.forEach((row) => {
      grouped[row.type] = (grouped[row.type] || 0) + 1;
    });
    return grouped;
  }, [rows]);

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
      if (text.includes(",") || text.includes('"') || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reportsByType.members || 0}</p>
                <p className="text-sm text-muted-foreground">Member Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reportsByType.impact || 0}</p>
                <p className="text-sm text-muted-foreground">Impact Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2.5">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentReports.length}</p>
                <p className="text-sm text-muted-foreground">Recent Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Report Templates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.value}
                    type="button"
                    onClick={() => setType(template.value as ReportType)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      type === template.value ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant={type === template.value ? "default" : "outline"}>
                        {template.value}
                      </Badge>
                    </div>
                    <p className="font-semibold">{template.label}</p>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Generate CSV Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Report Type</Label>
                  <Select value={type} onValueChange={(value) => setType(value as ReportType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="members">Members Report</SelectItem>
                      <SelectItem value="seats">Seats Report</SelectItem>
                      <SelectItem value="impact">Impact Report</SelectItem>
                      <SelectItem value="sales">Sales Report</SelectItem>
                      <SelectItem value="sponsorUtilization">Sponsor Utilization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={generateMeta} disabled={!canManage || saving} className="w-full">
                    {saving ? "Generating..." : "Generate & Download CSV"}
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium">Selected: {reportTemplates.find((t) => t.value === type)?.label}</p>
                <p className="mt-1">{reportTemplates.find((t) => t.value === type)?.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Report History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rows.length === 0 ? (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No reports generated yet.</p>
                  <p className="text-xs text-muted-foreground">Generate your first report to export data.</p>
                </div>
              ) : (
                rows.map((row) => (
                  <div key={row.id} className="rounded-lg border border-border/60 p-4 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize">{row.type} Report</p>
                          <Badge variant="secondary">{row.type}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{row.storagePath || "--"}</p>
                        {row.filters?.rows && (
                          <p className="mt-1 text-xs text-muted-foreground">{row.filters.rows} rows exported</p>
                        )}
                        {row.filters?.generatedAt && (
                          <p className="text-xs text-muted-foreground">
                            Generated: {new Date(row.filters.generatedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {row.filters?.downloadUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={row.filters.downloadUrl} target="_blank" rel="noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
