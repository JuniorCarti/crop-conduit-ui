import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { FarmLocation } from "@/types/climate";

interface FarmSelectorProps {
  farms: FarmLocation[];
  selectedFarmId: string | null;
  onSelect: (farmId: string) => void;
  isPremium: boolean;
  canAdd: boolean;
  onAddFarm: () => void;
  t: (key: string) => string;
}

export function FarmSelector({
  farms,
  selectedFarmId,
  onSelect,
  isPremium,
  canAdd,
  onAddFarm,
  t,
}: FarmSelectorProps) {
  const safeValue = farms.some((farm) => farm.id === selectedFarmId) ? selectedFarmId ?? "" : "";
  const hasFarms = farms.length > 0;

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{t("climate.locations.title")}</CardTitle>
          {!isPremium && hasFarms && (
            <Badge variant="outline" className="mt-2">
              {t("climate.locations.premiumHint")}
            </Badge>
          )}
        </div>
        <button
          type="button"
          className="text-sm font-medium text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onAddFarm}
          disabled={!canAdd}
        >
          {t("climate.farmSelector.add")}
        </button>
      </CardHeader>
      <CardContent>
        <Select
          value={safeValue}
          onValueChange={onSelect}
          disabled={!hasFarms || (!isPremium && farms.length <= 1)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("climate.farmSelector.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {!hasFarms && (
              <SelectItem value="none" disabled>
                {t("climate.farmSelector.empty")}
              </SelectItem>
            )}
            {farms.map((farm) => (
              <SelectItem key={farm.id} value={farm.id}>
                {farm.name} - {farm.ward}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!canAdd && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("climate.farmSelector.limit")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
