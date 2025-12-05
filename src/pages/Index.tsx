import { 
  TrendingUp, 
  Leaf, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Sprout,
  Bell,
  Loader2
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCropPrices, useFieldData, useCashflow, useAlerts, useHarvestSchedule } from "@/hooks/useApi";
import { useFieldHealth } from "@/hooks/useFieldHealth";
import { useNextHarvest } from "@/hooks/useNextHarvest";
import { formatKsh } from "@/lib/currency";

const quickActions = [
  { icon: TrendingUp, label: "Check Prices", color: "text-primary" },
  { icon: Leaf, label: "Field Status", color: "text-success" },
  { icon: Calendar, label: "Schedule", color: "text-info" },
  { icon: DollarSign, label: "Finance", color: "text-warning" },
];

export default function Index() {
  const [showAlerts, setShowAlerts] = useState(false);
  const navigate = useNavigate();

  // Fetch data using API hooks (now using real-time Firestore data)
  const { data: cropPrices, isLoading: pricesLoading, error: pricesError } = useCropPrices();
  const { data: fieldData, isLoading: fieldsLoading, error: fieldsError } = useFieldData();
  const { data: cashflowData, isLoading: cashflowLoading, error: cashflowError } = useCashflow();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: harvestSchedule, isLoading: harvestLoading } = useHarvestSchedule();
  
  // Real-time field health and harvest data (backup to API hooks)
  const { health: fieldHealthData } = useFieldHealth();
  const { harvests: nextHarvestData } = useNextHarvest();
  
  // Merge real-time data with API data for fieldData
  const enhancedFieldData = useMemo(() => {
    if (fieldData && fieldData.length > 0) return fieldData;
    // Fallback to field health data if API data not available
    return fieldHealthData.map((h) => ({
      id: h.fieldId,
      name: h.fieldName,
      crop: h.cropName || "Unknown",
      area: "N/A",
      ndvi: h.ndvi || 0.7,
      moisture: h.moisture || 60,
      health: h.health,
      lastUpdated: h.lastChecked instanceof Date 
        ? h.lastChecked.toISOString() 
        : new Date(h.lastChecked).toISOString(),
    }));
  }, [fieldData, fieldHealthData]);
  
  // Merge real-time harvest data
  const enhancedHarvestSchedule = useMemo(() => {
    if (harvestSchedule && harvestSchedule.length > 0) return harvestSchedule;
    // Fallback to next harvest data
    return nextHarvestData.map((h) => ({
      id: h.id || h.fieldId,
      field: h.fieldName,
      crop: h.cropName,
      optimalDate: h.optimalDate instanceof Date 
        ? format(h.optimalDate, "MMM dd, yyyy")
        : format(new Date(h.optimalDate), "MMM dd, yyyy"),
      workers: h.workers || 0,
      status: h.status,
    }));
  }, [harvestSchedule, nextHarvestData]);

  const totalRevenue = cashflowData?.reduce((sum, m) => sum + m.income, 0) || 0;
  const healthyFields = enhancedFieldData?.filter(f => f.health === "Good" || f.health === "Excellent").length || 0;
  
  const isLoading = pricesLoading || fieldsLoading || cashflowLoading || harvestLoading;

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Good Morning, John" 
        subtitle="Here's your farm overview"
        icon={Sprout}
      >
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => setShowAlerts(true)}
        >
          <Bell className="h-5 w-5" />
          {alerts && alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          )}
        </Button>
      </PageHeader>

      <div className="p-4 md:p-6 space-y-6">
        {/* Quick Actions */}
        <section className="animate-fade-up">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  if (action.label === "Check Prices") navigate("/market");
                  else if (action.label === "Field Status") navigate("/crops");
                  else if (action.label === "Schedule") navigate("/harvest");
                  else if (action.label === "Finance") navigate("/finance");
                }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
              >
                <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {(pricesError || fieldsError || cashflowError) && (
          <AlertCard
            type="danger"
            title="Error Loading Data"
            message="Failed to load dashboard data. Please try again later."
          />
        )}

        {/* Stats Overview */}
        {!isLoading && (
          <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Today's Best Price"
                value={cropPrices && cropPrices.length > 0 ? formatKsh(cropPrices[0]?.price || 0) : "N/A"}
                change={cropPrices && cropPrices.length > 0 ? `${cropPrices[0]?.name || ""} ${cropPrices[0]?.change ? (cropPrices[0].change > 0 ? "+" : "") + cropPrices[0].change + "%" : ""}` : cropPrices && cropPrices.length === 0 ? "Sync prices" : "No data"}
                changeType={cropPrices && cropPrices.length > 0 && cropPrices[0]?.trend === "up" ? "positive" : "neutral"}
                icon={TrendingUp}
                iconColor="text-primary"
              />
              <StatCard
                title="Field Health"
                value={enhancedFieldData && enhancedFieldData.length > 0 ? `${healthyFields}/${enhancedFieldData.length}` : "0/0"}
                change="Fields healthy"
                changeType="positive"
                icon={Leaf}
                iconColor="text-success"
              />
              <StatCard
                title="Revenue (6mo)"
                value={cashflowData && cashflowData.length > 0 ? formatKsh(totalRevenue / 1000000) + "M" : "N/A"}
                change={cashflowData && cashflowData.length > 0 ? "+18% vs last period" : "No data"}
                changeType="positive"
                icon={DollarSign}
                iconColor="text-warning"
              />
              <StatCard
                title="Next Harvest"
                value={enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0 ? enhancedHarvestSchedule[0]?.optimalDate.split(",")[0] || "N/A" : "N/A"}
                change={enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0 ? enhancedHarvestSchedule[0]?.field || "" : ""}
                changeType="neutral"
                icon={Calendar}
                iconColor="text-info"
              />
            </div>
          </section>
        )}

        {/* Active Alert */}
        {alerts && alerts.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <AlertCard
              type={alerts[0].type === "warning" ? "warning" : alerts[0].type === "success" ? "success" : "info"}
              title={alerts[0].title}
              message={alerts[0].message}
              action={alerts[0].actionUrl ? "View Details" : undefined}
              onAction={alerts[0].actionUrl ? () => navigate(alerts[0].actionUrl || "/") : undefined}
            />
          </section>
        )}

        {/* Revenue Chart */}
        {cashflowData && (
          <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Revenue Overview</h3>
                  <p className="text-xs text-muted-foreground">Last 6 months</p>
                </div>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                  +18%
                </span>
              </div>
              {cashflowLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cashflowData}>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis 
                          hide 
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="income" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expenses" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Expenses</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Field Status */}
        {enhancedFieldData && enhancedFieldData.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Field Status</h3>
              <Button variant="ghost" size="sm" className="text-primary h-8" onClick={() => navigate("/crops")}>
                View All
              </Button>
            </div>
            {fieldsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {enhancedFieldData.slice(0, 3).map((field) => (
                  <div 
                    key={field.id}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => navigate("/crops")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        field.health === "Excellent" || field.health === "Good" 
                          ? "bg-success/10 text-success" 
                          : field.health === "Moderate"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}>
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{field.name}</p>
                        <p className="text-xs text-muted-foreground">{field.crop} • {field.area}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        field.health === "Excellent" || field.health === "Good"
                          ? "text-success"
                          : field.health === "Moderate"
                          ? "text-warning"
                          : "text-destructive"
                      }`}>
                        {field.health}
                      </p>
                      <p className="text-xs text-muted-foreground">NDVI: {field.ndvi}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Upcoming Harvests */}
        {enhancedHarvestSchedule && enhancedHarvestSchedule.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Upcoming Harvests</h3>
              <Button variant="ghost" size="sm" className="text-primary h-8" onClick={() => navigate("/harvest")}>
                View Schedule
              </Button>
            </div>
            {harvestLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {enhancedHarvestSchedule.map((harvest) => (
                  <div 
                    key={harvest.id}
                    className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => navigate("/harvest")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        harvest.status === "Ready" 
                          ? "bg-success/10 text-success"
                          : harvest.status === "Pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-info/10 text-info"
                      }`}>
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{harvest.field}</p>
                        <p className="text-xs text-muted-foreground">{harvest.crop} • {harvest.workers} workers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{harvest.optimalDate}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        harvest.status === "Ready"
                          ? "bg-success/10 text-success"
                          : harvest.status === "Pending"
                          ? "bg-warning/10 text-warning"
                          : "bg-info/10 text-info"
                      }`}>
                        {harvest.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Alerts Dialog */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Notifications
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {alertsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  type={alert.type === "error" ? "danger" : alert.type as "warning" | "info" | "success"}
                  title={alert.title}
                  message={alert.message}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
