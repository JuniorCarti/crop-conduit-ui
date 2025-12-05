import { AlertTriangle, Shield, Droplets, Sun, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { analyzeCrop } from "@/utils/cropAnalysis";
import { type Crop } from "@/services/firestore";

interface CropAnalysisCardProps {
  crop: Crop;
}

export function CropAnalysisCard({ crop }: CropAnalysisCardProps) {
  const analysis = analyzeCrop(crop);

  return (
    <div className="space-y-4">
      {/* Growth Stage */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sun className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-foreground">Growth Stage</h4>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Stage</span>
            <Badge variant="outline" className="font-medium">
              {analysis.growthStage.stage}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {analysis.growthStage.daysSincePlanting} days since planting
            </span>
            <span className="text-muted-foreground">
              {analysis.growthStage.weeksSincePlanting} weeks
            </span>
          </div>
          <Progress value={analysis.growthStage.progress} className="h-2" />
        </div>
      </div>

      {/* Pest & Disease Risks */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h4 className="font-semibold text-foreground">Pest & Disease Risks</h4>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Common Pests:</p>
            <div className="flex flex-wrap gap-1">
              {analysis.risks.pests.map((pest, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {pest}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Common Diseases:</p>
            <div className="flex flex-wrap gap-1">
              {analysis.risks.diseases.map((disease, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {disease}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Prevention Steps */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-success" />
          <h4 className="font-semibold text-foreground">Prevention Steps</h4>
        </div>
        <ul className="space-y-2">
          {analysis.risks.prevention.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-1">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weather Alerts */}
      {analysis.weatherAlerts.alerts.length > 0 && (
        <div className="space-y-2">
          {analysis.weatherAlerts.alerts.map((alert, idx) => (
            <Alert
              key={idx}
              className={
                alert.type === "danger"
                  ? "border-destructive bg-destructive/10"
                  : alert.type === "warning"
                  ? "border-warning bg-warning/10"
                  : "border-info bg-info/10"
              }
            >
              {alert.type === "danger" ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : alert.type === "warning" ? (
                <AlertTriangle className="h-4 w-4 text-warning" />
              ) : (
                <Info className="h-4 w-4 text-info" />
              )}
              <AlertDescription
                className={
                  alert.type === "danger"
                    ? "text-destructive"
                    : alert.type === "warning"
                    ? "text-warning"
                    : "text-info"
                }
              >
                {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

