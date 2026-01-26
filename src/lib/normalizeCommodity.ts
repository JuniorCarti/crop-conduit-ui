/**
 * Normalize commodity labels to API-safe values.
 */

export type NormalizedCommodity = "tomatoes" | "cabbage" | "potatoes" | "onion" | "kale";

export function normalizeCommodity(label: string): NormalizedCommodity | null {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return null;

  if (normalized.includes("tomato")) return "tomatoes";
  if (normalized.includes("cabbage")) return "cabbage";
  if (normalized.includes("potato")) return "potatoes";
  if (normalized.includes("onion")) return "onion";
  if (normalized.includes("kale") || normalized.includes("sukuma")) return "kale";

  return null;
}
