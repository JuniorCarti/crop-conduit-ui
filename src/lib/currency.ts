/**
 * Currency formatting utilities for Kenyan Shillings
 */

/**
 * Format a number as Kenyan Shillings
 * @param amount - The amount to format
 * @param useKES - Whether to use "KES" instead of "Ksh" (default: false)
 * @returns Formatted string like "Ksh 1,200" or "KES 1,200"
 */
export function formatKsh(amount: number, useKES: boolean = false): string {
  const prefix = useKES ? "KES" : "Ksh";
  return `${prefix} ${amount.toLocaleString("en-KE")}`;
}

/**
 * Format a number as Kenyan Shillings with decimals
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 * @param useKES - Whether to use "KES" instead of "Ksh" (default: false)
 * @returns Formatted string like "Ksh 1,200.50"
 */
export function formatKshDecimal(amount: number, decimals: number = 0, useKES: boolean = false): string {
  const prefix = useKES ? "KES" : "Ksh";
  return `${prefix} ${amount.toLocaleString("en-KE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Format price per unit (e.g., per kg, per 90kg bag)
 * @param amount - The amount to format
 * @param unit - The unit (e.g., "kg", "per 90kg")
 * @param useKES - Whether to use "KES" instead of "Ksh" (default: false)
 * @returns Formatted string like "Ksh 35/kg"
 */
export function formatPricePerUnit(amount: number, unit: string, useKES: boolean = false): string {
  const prefix = useKES ? "KES" : "Ksh";
  return `${prefix} ${amount.toLocaleString("en-KE")}/${unit}`;
}

