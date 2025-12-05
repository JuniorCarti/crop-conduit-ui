import { useMemo } from "react";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import { AlertCard } from "@/components/shared/AlertCard";
import { Badge } from "@/components/ui/badge";
import { formatKsh } from "@/lib/currency";
import { type Resource } from "@/services/firestore";

interface CostOptimizerProps {
  resources: Resource[];
}

export function CostOptimizer({ resources }: CostOptimizerProps) {
  // Group resources by type and find cheapest suppliers
  const optimizationSuggestions = useMemo(() => {
    const grouped = resources.reduce((acc, resource) => {
      if (!resource.supplier || !resource.unitCost) return acc;
      
      const key = `${resource.type}-${resource.name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(resource);
      return acc;
    }, {} as Record<string, Resource[]>);

    const suggestions: Array<{
      resourceName: string;
      type: string;
      current: Resource;
      cheapest: Resource;
      savings: number;
    }> = [];

    Object.entries(grouped).forEach(([key, resources]) => {
      if (resources.length < 2) return; // Need at least 2 suppliers to compare

      // Sort by unit cost
      const sorted = [...resources].sort((a, b) => 
        (a.unitCost || 0) - (b.unitCost || 0)
      );

      const cheapest = sorted[0];
      
      // Find resources that are not using the cheapest supplier
      resources.forEach(resource => {
        if (resource.id !== cheapest.id && resource.unitCost && cheapest.unitCost) {
          const savings = (resource.unitCost - cheapest.unitCost) * resource.recommendedQuantity;
          if (savings > 0) {
            suggestions.push({
              resourceName: resource.name,
              type: resource.type,
              current: resource,
              cheapest,
              savings,
            });
          }
        }
      });
    });

    return suggestions.sort((a, b) => b.savings - a.savings);
  }, [resources]);

  // Calculate total potential savings
  const totalSavings = useMemo(() => {
    return optimizationSuggestions.reduce((sum, s) => sum + s.savings, 0);
  }, [optimizationSuggestions]);

  // Total current cost
  const totalCurrentCost = useMemo(() => {
    return resources.reduce((sum, r) => 
      sum + (r.totalCost || (r.unitCost || 0) * r.recommendedQuantity), 0
    );
  }, [resources]);

  if (optimizationSuggestions.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 border border-border/50 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="h-8 w-8 text-success" />
        </div>
        <p className="font-medium text-foreground mb-2">No Cost Optimization Opportunities</p>
        <p className="text-sm text-muted-foreground">
          You're already using the most cost-effective suppliers, or you need to add more suppliers for comparison.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Current Total Cost</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatKsh(totalCurrentCost)}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingDown className="h-4 w-4 text-success" />
            <span className="text-sm">Potential Savings</span>
          </div>
          <p className="text-2xl font-bold text-success">{formatKsh(totalSavings)}</p>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4 text-info" />
            <span className="text-sm">Optimized Cost</span>
          </div>
          <p className="text-2xl font-bold text-info">
            {formatKsh(totalCurrentCost - totalSavings)}
          </p>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="space-y-3">
        <h4 className="font-semibold text-foreground">
          Cost Optimization Suggestions ({optimizationSuggestions.length})
        </h4>
        
        {optimizationSuggestions.map((suggestion, index) => (
          <div
            key={index}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-semibold text-foreground">{suggestion.resourceName}</h5>
                  <Badge variant="outline" className="capitalize">
                    {suggestion.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Current: {suggestion.current.supplier} @ {formatKsh(suggestion.current.unitCost || 0)}/{suggestion.current.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-success">
                  Save {formatKsh(suggestion.savings)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((suggestion.savings / (suggestion.current.totalCost || suggestion.current.unitCost! * suggestion.current.recommendedQuantity)) * 100)}% cheaper
                </p>
              </div>
            </div>

            <div className="bg-success/10 border border-success/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Recommended Supplier</span>
              </div>
              <p className="text-sm text-foreground">
                Switch to <strong>{suggestion.cheapest.supplier}</strong> @ {formatKsh(suggestion.cheapest.unitCost || 0)}/{suggestion.cheapest.unit}
              </p>
              {suggestion.cheapest.supplierContact && (
                <p className="text-xs text-muted-foreground mt-1">
                  Contact: {suggestion.cheapest.supplierContact}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info Alert */}
      <AlertCard
        type="info"
        title="How It Works"
        message="Cost Optimizer compares suppliers for the same resource type and suggests switching to cheaper alternatives. Add multiple suppliers for the same resource to see optimization opportunities."
      />
    </div>
  );
}

