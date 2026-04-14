/**
 * Export Compliance Checker Component (UI Mockup)
 * Certifications, documentation requirements, and compliance tracking
 */

import { Shield, CheckCircle2, AlertTriangle, FileText, Globe, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const targetMarkets = [
  {
    country: "United Kingdom",
    flag: "🇬🇧",
    compliance: 85,
    status: "ready",
    requirements: 12,
    completed: 10,
    missing: ["Organic Certification", "Traceability Documentation"],
  },
  {
    country: "United Arab Emirates",
    flag: "🇦🇪",
    compliance: 60,
    status: "in-progress",
    requirements: 10,
    completed: 6,
    missing: ["Halal Certification", "Phytosanitary Certificate", "Certificate of Origin", "Quality Inspection Report"],
  },
  {
    country: "Netherlands",
    flag: "🇳🇱",
    compliance: 95,
    status: "ready",
    requirements: 15,
    completed: 14,
    missing: ["Fair Trade Certification"],
  },
];

const certifications = [
  { name: "GlobalGAP", status: "valid", expiry: "2024-12-31", required: ["UK", "Netherlands", "Germany"] },
  { name: "HACCP", status: "valid", expiry: "2024-10-15", required: ["UAE", "Saudi Arabia"] },
  { name: "Organic (EU)", status: "expired", expiry: "2024-01-10", required: ["UK", "Netherlands"] },
  { name: "Fair Trade", status: "pending", expiry: null, required: ["Netherlands", "USA"] },
  { name: "Rainforest Alliance", status: "valid", expiry: "2025-03-20", required: ["UK", "USA"] },
];

const documentChecklist = [
  { doc: "Phytosanitary Certificate", status: "complete", markets: ["All"] },
  { doc: "Certificate of Origin", status: "complete", markets: ["UAE", "Saudi Arabia"] },
  { doc: "Commercial Invoice", status: "complete", markets: ["All"] },
  { doc: "Packing List", status: "complete", markets: ["All"] },
  { doc: "Bill of Lading", status: "pending", markets: ["All"] },
  { doc: "Quality Inspection Report", status: "pending", markets: ["UAE", "UK"] },
  { doc: "Traceability Documentation", status: "missing", markets: ["UK", "Netherlands"] },
];

export function ExportComplianceChecker() {
  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Export Compliance Checker
            </CardTitle>
            <CardDescription>
              Certifications, documentation, and compliance tracking
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-info/10 text-info">
            UI Mockup
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Markets Compliance */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Target Markets Compliance</h3>
          <div className="space-y-3">
            {targetMarkets.map((market) => (
              <div
                key={market.country}
                className="border border-border/60 rounded-lg p-4 hover:border-primary/40 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{market.flag}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{market.country}</p>
                      <p className="text-xs text-muted-foreground">
                        {market.completed} / {market.requirements} requirements met
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      market.status === "ready"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {market.status === "ready" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {market.status === "in-progress" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {market.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compliance Score</span>
                    <span className="font-semibold text-foreground">{market.compliance}%</span>
                  </div>
                  <Progress value={market.compliance} className="h-2" />
                </div>

                {market.missing.length > 0 && (
                  <div className="bg-warning/10 rounded-md p-3">
                    <p className="text-xs font-semibold text-warning mb-2">Missing Requirements:</p>
                    <ul className="space-y-1">
                      {market.missing.map((req) => (
                        <li key={req} className="text-xs text-foreground flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-warning" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Certifications Status</h3>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Required for: {cert.required.join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={
                      cert.status === "valid"
                        ? "bg-success/10 text-success text-xs"
                        : cert.status === "expired"
                        ? "bg-destructive/10 text-destructive text-xs"
                        : "bg-warning/10 text-warning text-xs"
                    }
                  >
                    {cert.status}
                  </Badge>
                  {cert.expiry && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {cert.expiry}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Checklist */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Export Documentation Checklist</h3>
          <div className="space-y-2">
            {documentChecklist.map((doc) => (
              <div
                key={doc.doc}
                className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{doc.doc}</p>
                    <p className="text-xs text-muted-foreground">
                      Required for: {doc.markets.join(", ")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    doc.status === "complete"
                      ? "bg-success/10 text-success text-xs"
                      : doc.status === "pending"
                      ? "bg-warning/10 text-warning text-xs"
                      : "bg-destructive/10 text-destructive text-xs"
                  }
                >
                  {doc.status === "complete" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {doc.status === "pending" && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            <Shield className="h-4 w-4 mr-2" />
            Run Full Audit
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <FileText className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        {/* Info Footer */}
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
          💡 Compliance requirements vary by destination country. Ensure all certifications are valid and documentation is complete before shipping to avoid customs delays.
        </div>
      </CardContent>
    </Card>
  );
}
