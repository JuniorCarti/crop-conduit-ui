import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createGovReport, listGovReports } from "@/services/govAggregatesService";
import { useUserAccount } from "@/hooks/useUserAccount";
import { toast } from "sonner";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

type ReportType = "national_summary" | "county_summary" | "market_trend" | "climate_risk";

const reportTypeLabels: Record<ReportType, string> = {
  national_summary: "National summary report",
  county_summary: "County summary report",
  market_trend: "Market trend report",
  climate_risk: "Climate risk report",
};

export default function GovReports() {
  const account = useUserAccount();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>("national_summary");
  const query = useQuery({
    queryKey: ["govReports"],
    queryFn: listGovReports,
  });

  const generate = async () => {
    try {
      await createGovReport({
        type,
        createdByUid: account.data?.uid ?? "unknown",
      });
      toast.success("Report generated.");
      setOpen(false);
      await query.refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate report.");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Report generator</CardTitle>
          <Button onClick={() => setOpen(true)}>Generate</Button>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Generate aggregate CSV-ready metadata for national and county reporting.
        </CardContent>
      </Card>
      {!query.data || query.data.length === 0 ? (
        <GovEmptyState title="No generated reports yet." />
      ) : (
        <Card className="border-border/60">
          <CardHeader><CardTitle>Generated reports</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {query.data.map((row: any) => (
              <div key={row.id} className="flex flex-col gap-2 rounded border border-border/60 p-3 text-sm md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium capitalize">{reportTypeLabels[(row.type as ReportType) ?? "national_summary"] ?? row.type}</p>
                  <p className="text-xs text-muted-foreground">Created by {row.createdByUid ?? "--"}</p>
                </div>
                <Button variant="outline" size="sm" disabled>Download CSV</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={type} onValueChange={(value) => setType(value as ReportType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={generate}>Generate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

