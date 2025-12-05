import { useState } from "react";
import { Calendar, Droplets, Sun, AlertTriangle, TrendingUp, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCrop, useCropActivities, useCropRecommendations, useCropGrowthData } from "@/hooks/useCrops";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface CropDetailsModalProps {
  cropId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManage?: () => void;
}

export function CropDetailsModal({ cropId, open, onOpenChange, onManage }: CropDetailsModalProps) {
  const { data: crop, isLoading: cropLoading } = useCrop(cropId);
  const { activities, isLoading: activitiesLoading } = useCropActivities(cropId);
  const { recommendations, isLoading: recommendationsLoading } = useCropRecommendations(cropId);
  const { growthData, isLoading: growthLoading } = useCropGrowthData(cropId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
      case "Harvest Ready":
        return "bg-success/10 text-success border-success/30";
      case "Needs Attention":
        return "bg-warning/10 text-warning border-warning/30";
      case "Pest Alert":
        return "bg-destructive/10 text-destructive border-destructive/30";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  // Prepare chart data
  const ndviChartData = growthData.map((point) => ({
    date: format(new Date(point.date), "MMM d"),
    ndvi: point.ndvi || 0,
    moisture: point.moisture || 0,
  }));

  const activityChartData = activities
    .filter(a => a.type === "irrigation" || a.type === "fertilization")
    .reduce((acc, activity) => {
      const date = format(new Date(activity.date), "MMM d");
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing[activity.type] = (existing[activity.type] || 0) + (activity.amount || 0);
      } else {
        acc.push({
          date,
          irrigation: activity.type === "irrigation" ? (activity.amount || 0) : 0,
          fertilization: activity.type === "fertilization" ? (activity.amount || 0) : 0,
        });
      }
      return acc;
    }, [] as any[]);

  if (!cropId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Crop Details</DialogTitle>
        </DialogHeader>

        {cropLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !crop ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Crop not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{crop.name}</h3>
                <p className="text-muted-foreground">{crop.type} • {crop.field}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Badge className={getStatusColor(crop.status)}>
                  {crop.status}
                </Badge>
                {onManage && (
                  <Button size="sm" onClick={onManage}>
                    Manage Crop
                  </Button>
                )}
              </div>
            </div>

            {/* Alerts */}
            {crop.alerts && crop.alerts.length > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h4 className="font-semibold text-warning">Active Alerts</h4>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                  {crop.alerts.map((alert, idx) => (
                    <li key={idx}>{alert}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Planted</span>
                </div>
                <p className="font-semibold text-foreground">
                  {format(new Date(crop.plantingDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Harvest</span>
                </div>
                <p className="font-semibold text-foreground">
                  {format(new Date(crop.harvestDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Est. Yield</span>
                </div>
                <p className="font-semibold text-foreground">{crop.estimatedYield} tons/ha</p>
              </div>
              {crop.ndvi !== undefined && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Sun className="h-4 w-4" />
                    <span className="text-xs">NDVI</span>
                  </div>
                  <p className={`font-semibold ${
                    crop.ndvi >= 0.7 ? "text-success" :
                    crop.ndvi >= 0.5 ? "text-warning" : "text-destructive"
                  }`}>
                    {crop.ndvi.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Additional Metrics */}
            {(crop.soilMoisture !== undefined || crop.growthStage) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {crop.soilMoisture !== undefined && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Droplets className="h-4 w-4" />
                      <span className="text-xs">Soil Moisture</span>
                    </div>
                    <p className="font-semibold text-foreground">{crop.soilMoisture}%</p>
                  </div>
                )}
                {crop.growthStage && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Growth Stage</span>
                    </div>
                    <p className="font-semibold text-foreground">{crop.growthStage}</p>
                  </div>
                )}
              </div>
            )}

            {/* Growth Chart */}
            {growthData.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">Growth Trends</h4>
                {growthLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ndviChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="ndvi" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="NDVI"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="moisture" 
                          stroke="hsl(var(--info))" 
                          strokeWidth={2}
                          name="Moisture %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Activity Chart */}
            {activityChartData.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">Water & Fertilizer Usage</h4>
                {activitiesLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="irrigation" fill="hsl(var(--info))" name="Irrigation (L)" />
                        <Bar dataKey="fertilization" fill="hsl(var(--success))" name="Fertilizer (kg)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">Recommendations</h4>
                {recommendationsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className={`p-3 rounded-lg border ${
                          rec.priority === "high"
                            ? "bg-destructive/10 border-destructive/30"
                            : rec.priority === "medium"
                            ? "bg-warning/10 border-warning/30"
                            : "bg-info/10 border-info/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-foreground capitalize">{rec.type}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{rec.message}</p>
                        {rec.action && (
                          <p className="text-xs text-foreground font-medium mt-2">
                            Action: {rec.action}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recent Activities */}
            {activities.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-4">Recent Activities</h4>
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground capitalize">
                              {activity.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                          {activity.amount && activity.unit && (
                            <p className="text-xs text-foreground mt-1">
                              {activity.amount} {activity.unit}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

