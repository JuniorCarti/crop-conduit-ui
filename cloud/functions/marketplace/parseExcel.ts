/**
 * Cloud Function to Parse Market Prices Excel
 * Alternative to client-side parsing
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as XLSX from "xlsx";

const db = admin.firestore();

interface MarketPriceRow {
  Commodity: string;
  Classification?: string;
  Grade?: string;
  Sex?: string;
  Market: string;
  Wholesale: number | string;
  Retail: number | string;
  Supply?: string;
  Volume?: number | string;
  County?: string;
  Date: Date | string | number;
}

/**
 * Parse Excel date
 */
function parseExcelDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    // Try Excel date format
    const parts = value.split(/[-/]/);
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      return new Date(year, month, day);
    }
  }
  if (typeof value === "number") {
    return XLSX.SSF.parse_date_code(value);
  }
  throw new Error(`Invalid date: ${value}`);
}

/**
 * Parse Market Prices Excel file
 * Callable function for frontend
 */
export const parseMarketPricesExcel = functions.https.onCall(async (data, context) => {
  try {
    const { url } = data;
    const excelUrl = url || "https://ipgdvtkluvqpmnvuaows.supabase.co/storage/v1/object/public/uploads/Market%20Prices.xlsx";

    // Fetch Excel file
    const response = await axios.get(excelUrl, {
      responseType: "arraybuffer",
    });

    // Parse Excel
    const workbook = XLSX.read(response.data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: MarketPriceRow[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
    });

    const prices: any[] = [];
    const errors: string[] = [];

    // Process each row
    jsonData.forEach((row: any, index: number) => {
      try {
        // Validate required fields
        if (!row.Commodity || !row.Market || !row.Date) {
          errors.push(`Row ${index + 2}: Missing required fields`);
          return;
        }

        // Parse date
        let date: Date;
        try {
          date = parseExcelDate(row.Date);
        } catch (error: any) {
          errors.push(`Row ${index + 2}: Invalid date - ${error.message}`);
          return;
        }

        // Parse numeric fields
        const wholesale = parseFloat(String(row.Wholesale)) || 0;
        const retail = parseFloat(String(row.Retail)) || 0;
        const volume = row.Volume ? parseFloat(String(row.Volume)) : undefined;

        if (isNaN(wholesale) || isNaN(retail)) {
          errors.push(`Row ${index + 2}: Invalid numeric values`);
          return;
        }

        prices.push({
          commodity: String(row.Commodity).trim(),
          classification: row.Classification ? String(row.Classification).trim() : undefined,
          grade: row.Grade ? String(row.Grade).trim() : undefined,
          sex: row.Sex ? String(row.Sex).trim() : undefined,
          market: String(row.Market).trim(),
          wholesale,
          retail,
          supply: row.Supply ? String(row.Supply).trim() : undefined,
          volume,
          county: row.County ? String(row.County).trim() : "",
          date: date.toISOString(),
        });
      } catch (error: any) {
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    });

    return {
      prices,
      errors: errors.slice(0, 10), // Return first 10 errors
      total: jsonData.length,
      success: prices.length,
    };
  } catch (error: any) {
    functions.logger.error("Error parsing Excel:", error);
    throw new functions.https.HttpsError("internal", error.message || "Failed to parse Excel file");
  }
});
