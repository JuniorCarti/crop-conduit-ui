import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Plus, Clock, Mail, Download, Trash2 } from "lucide-react";

export default function BuyerCustomReports() {
  const [showNewReport, setShowNewReport] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState("");
  const [frequency, setFrequency] = useState("monthly");

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <p className="text-sm text-muted-foreground">Create, schedule, and export procurement reports</p>
        </div>
        <Button onClick={() => setShowNewReport(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Report Templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Spend Analysis", desc: "Detailed spend breakdown by commodity, supplier, region" },
            { name: "Supplier Performance", desc: "Scorecard with KPIs and trend analysis" },
            { name: "Price Trends", desc: "Historical pricing and market comparison" },
            { name: "Budget vs Actual", desc: "Budget tracking and variance analysis" },
            { name: "Quality Metrics", desc: "Defect rates and quality scores" },
            { name: "Delivery Performance", desc: "On-time delivery and logistics metrics" },
          ].map((template) => (
            <Card key={template.name} className="border-border/60 cursor-pointer hover:border-primary/50">
              <CardContent className="pt-6">
                <FileText className="mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">{template.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{template.desc}</p>
                <Button size="sm" variant="outline" className="mt-4 w-full">
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Saved Reports */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Saved Reports</h2>
        <div className="space-y-3">
          {[
            {
              name: "Monthly Spend Report - March 2024",
              type: "Spend Analysis",
              created: "Mar 15, 2024",
              scheduled: true,
              frequency: "Monthly",
            },
            {
              name: "Supplier Scorecard Q1 2024",
              type: "Supplier Performance",
              created: "Mar 10, 2024",
              scheduled: false,
            },
            {
              name: "Price Trends - Tomatoes",
              type: "Price Trends",
              created: "Mar 8, 2024",
              scheduled: true,
              frequency: "Weekly",
            },
            {
              name: "Budget vs Actual - Feb 2024",
              type: "Budget vs Actual",
              created: "Mar 1, 2024",
              scheduled: false,
            },
          ].map((report) => (
            <Card key={report.name} className="border-border/60">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <p className="font-medium">{report.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline">{report.type}</Badge>
                    <Badge variant="secondary">{report.created}</Badge>
                    {report.scheduled && (
                      <Badge className="bg-blue-600">
                        <Clock className="mr-1 h-3 w-3" />
                        {report.frequency}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New Report Dialog */}
      <Dialog open={showNewReport} onOpenChange={setShowNewReport}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Report Name</Label>
              <Input
                placeholder="e.g., Monthly Spend Report"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-2 block">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spend">Spend Analysis</SelectItem>
                  <SelectItem value="supplier">Supplier Performance</SelectItem>
                  <SelectItem value="price">Price Trends</SelectItem>
                  <SelectItem value="budget">Budget vs Actual</SelectItem>
                  <SelectItem value="quality">Quality Metrics</SelectItem>
                  <SelectItem value="delivery">Delivery Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Schedule Delivery</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No schedule</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewReport(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowNewReport(false)}>Create Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
