import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BuyerProfileTabKey } from "@/types/buyerProfile";

const TABS: Array<{ key: BuyerProfileTabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "company", label: "Company & Verification" },
  { key: "preferences", label: "Preferences" },
  { key: "suppliers", label: "Suppliers" },
  { key: "orders", label: "Orders & Logistics" },
  { key: "contracts", label: "Contracts" },
  { key: "alerts", label: "Alerts" },
  { key: "messages", label: "Messages" },
];

export function BuyerProfileTabNav() {
  return (
    <TabsList className="h-auto w-full justify-start overflow-x-auto bg-muted/60 p-1">
      {TABS.map((tab) => (
        <TabsTrigger key={tab.key} value={tab.key} className="whitespace-nowrap">
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
