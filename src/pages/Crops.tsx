import { useState } from "react";
import { Leaf, Droplets, Sun, AlertTriangle, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AlertCard } from "@/components/shared/AlertCard";
import { Button } from "@/components/ui/button";
import { fieldData, ndviHistory, yieldForecasts } from "@/data/dummyData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function Crops() {
  const [selectedField, setSelectedField] = useState<typeof fieldData[0] | null>(null);

  const getHealthColor = (health: string) => {
    switch (health) {
      case "Excellent": return "text-success bg-success/10";
      case "Good": return "text-success bg-success/10";
      case "Moderate": return "text-warning bg-warning/10";
      default: return "text-destructive bg-destructive/10";
    }
  };

  const getNdviColor = (ndvi: number) => {
    if (ndvi >= 0.7) return "text-success";
    if (ndvi >= 0.5) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Crop Intelligence" 
        subtitle="Sentinel Agent • Field monitoring"
        icon={Leaf}
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Alert */}
        <div className="animate-fade-up">
          <AlertCard
            type="warning"
            title="Crop Stress Detected"
            message="West Garden showing signs of water stress. NDVI dropped below 0.6"
            action="View Details"
            onAction={() => setSelectedField(fieldData.find(f => f.name === "West Garden") || null)}
          />
        </div>

        {/* NDVI Overview Chart */}
        <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">NDVI Trends</h3>
                <p className="text-xs text-muted-foreground">Vegetation health index</p>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ndviHistory}>
                  <defs>
                    <linearGradient id="ndviGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis hide domain={[0.4, 1]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="north" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#ndviGradient)"
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="east" 
                    stroke="hsl(var(--success))" 
                    fill="transparent"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">North Field</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">East Plot</span>
              </div>
            </div>
          </div>
        </section>

        {/* Field Cards */}
        <section className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <h3 className="font-semibold text-foreground mb-3">Your Fields</h3>
          <div className="grid gap-3">
            {fieldData.map((field) => (
              <button
                key={field.id}
                onClick={() => setSelectedField(field)}
                className="bg-card rounded-xl p-4 border border-border/50 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getHealthColor(field.health)}`}>
                      <Leaf className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{field.name}</p>
                      <p className="text-sm text-muted-foreground">{field.crop} • {field.area}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getHealthColor(field.health)}`}>
                    {field.health}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Sun className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">NDVI</span>
                    </div>
                    <p className={`text-lg font-bold ${getNdviColor(field.ndvi)}`}>{field.ndvi}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Droplets className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Moisture</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{field.moisture}%</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Yield Forecasts */}
        <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border/50">
            <h3 className="font-semibold text-foreground mb-4">Yield Forecasts</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldForecasts} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="field" 
                    axisLine={false}
                    tickLine={false}
                    width={80}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="current" fill="hsl(var(--muted))" radius={4} />
                  <Bar dataKey="projected" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                <span className="text-xs text-muted-foreground">Current</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Projected</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Field Detail Modal */}
      <Dialog open={!!selectedField} onOpenChange={() => setSelectedField(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {selectedField?.name} Details
            </DialogTitle>
          </DialogHeader>
          {selectedField && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Crop</p>
                  <p className="text-lg font-bold text-foreground">{selectedField.crop}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Area</p>
                  <p className="text-lg font-bold text-foreground">{selectedField.area}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">NDVI Index</span>
                    <span className={`text-sm font-bold ${getNdviColor(selectedField.ndvi)}`}>
                      {selectedField.ndvi}
                    </span>
                  </div>
                  <Progress value={selectedField.ndvi * 100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Soil Moisture</span>
                    <span className="text-sm font-bold text-foreground">{selectedField.moisture}%</span>
                  </div>
                  <Progress value={selectedField.moisture} className="h-2" />
                </div>
              </div>

              <div className={`rounded-lg p-3 ${getHealthColor(selectedField.health)}`}>
                <div className="flex items-center gap-2">
                  {selectedField.health === "Needs Attention" && (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <span className="font-medium">Health Status: {selectedField.health}</span>
                </div>
                {selectedField.health === "Needs Attention" && (
                  <p className="text-sm mt-1 opacity-90">
                    Increase irrigation and check for pest activity
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">View History</Button>
                <Button variant="outline" className="flex-1">Get Recommendations</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
