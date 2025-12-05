import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { type Resource } from "@/services/firestore";
import { format } from "date-fns";
import { formatKsh } from "@/lib/currency";

interface ResourceChartsProps {
  resources: Resource[];
}

export function ResourceCharts({ resources }: ResourceChartsProps) {
  // Prepare usage trend data (grouped by month)
  const usageTrendData = useMemo(() => {
    const grouped = resources.reduce((acc, resource) => {
      if (!resource.applicationDate) return acc;
      
      const month = format(new Date(resource.applicationDate), "MMM yyyy");
      if (!acc[month]) {
        acc[month] = { month, fertilizer: 0, seed: 0, pesticide: 0, water: 0 };
      }
      
      const cost = resource.totalCost || resource.unitCost * resource.recommendedQuantity;
      if (resource.type === "fertilizer") acc[month].fertilizer += cost;
      else if (resource.type === "seed") acc[month].seed += cost;
      else if (resource.type === "pesticide") acc[month].pesticide += cost;
      else if (resource.type === "water") acc[month].water += cost;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [resources]);

  // Cost breakdown by type
  const costBreakdownData = useMemo(() => {
    const breakdown = resources.reduce((acc, resource) => {
      const cost = resource.totalCost || resource.unitCost * resource.recommendedQuantity;
      acc[resource.type] = (acc[resource.type] || 0) + cost;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([type, cost]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      cost,
    }));
  }, [resources]);

  // Water usage over time (if water resources exist)
  const waterUsageData = useMemo(() => {
    return resources
      .filter(r => r.type === "water" && r.applicationDate)
      .map(r => ({
        date: format(new Date(r.applicationDate!), "MMM d"),
        quantity: r.recommendedQuantity,
        cost: r.totalCost || r.unitCost * r.recommendedQuantity,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [resources]);

  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-foreground">Analytics & Trends</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        {usageTrendData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-4">Usage Trends Over Time</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatKsh(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="fertilizer" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Fertilizer"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="seed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Seed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pesticide" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    name="Pesticide"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    name="Water"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {costBreakdownData.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-4">Cost Breakdown by Type</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="type" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `Ksh ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatKsh(value)}
                  />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" name="Cost (Ksh)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Water Usage Chart */}
      {waterUsageData.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-semibold text-foreground mb-4">Water Usage Over Time</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterUsageData}>
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
                <Bar dataKey="quantity" fill="hsl(var(--info))" name="Quantity (L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

