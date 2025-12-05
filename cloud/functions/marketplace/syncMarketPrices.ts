/**
 * Cloud Function to Sync Market Prices from Excel
 * Scheduled function to fetch and update market prices
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as XLSX from "xlsx";

const db = admin.firestore();
const EXCEL_URL = "https://ipgdvtkluvqpmnvuaows.supabase.co/storage/v1/object/public/uploads/Market%20Prices.xlsx";

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
 * Generate composite key for market price
 */
function generatePriceKey(commodity: string, market: string, date: Date): string {
  const dateStr = date.toISOString().split("T")[0];
  return `${commodity}_${market}_${dateStr}`.replace(/[^a-zA-Z0-9_]/g, "_");
}

/**
 * Parse date from Excel
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
  }
  if (typeof value === "number") {
    // Excel serial date
    return XLSX.SSF.parse_date_code(value);
  }
  throw new Error(`Invalid date: ${value}`);
}

/**
 * Scheduled function to sync market prices
 * Runs daily at 6 AM UTC
 */
export const syncMarketPricesScheduled = functions.pubsub
  .schedule("0 6 * * *") // Daily at 6 AM UTC
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      functions.logger.info("Starting market prices sync...");

      // Fetch Excel file
      const response = await axios.get(EXCEL_URL, {
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

      let success = 0;
      let errors = 0;
      const errorLogs: string[] = [];

      // Process in batches
      const batchSize = 500;
      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize);
        const writeBatch = db.batch();

        for (const row of batch) {
          try {
            // Validate required fields
            if (!row.Commodity || !row.Market || !row.Date) {
              errors++;
              errorLogs.push(`Row ${i + 1}: Missing required fields`);
              continue;
            }

            // Parse date
            let date: Date;
            try {
              date = parseExcelDate(row.Date);
            } catch (error: any) {
              errors++;
              errorLogs.push(`Row ${i + 1}: Invalid date - ${error.message}`);
              continue;
            }

            // Parse numeric fields
            const wholesale = parseFloat(String(row.Wholesale)) || 0;
            const retail = parseFloat(String(row.Retail)) || 0;
            const volume = row.Volume ? parseFloat(String(row.Volume)) : undefined;

            if (isNaN(wholesale) || isNaN(retail)) {
              errors++;
              errorLogs.push(`Row ${i + 1}: Invalid numeric values`);
              continue;
            }

            // Create document
            const key = generatePriceKey(row.Commodity, row.Market, date);
            const docRef = db.collection("market_prices").doc(key);

            writeBatch.set(
              docRef,
              {
                commodity: String(row.Commodity).trim(),
                classification: row.Classification ? String(row.Classification).trim() : null,
                grade: row.Grade ? String(row.Grade).trim() : null,
                sex: row.Sex ? String(row.Sex).trim() : null,
                market: String(row.Market).trim(),
                wholesale,
                retail,
                supply: row.Supply ? String(row.Supply).trim() : null,
                volume: volume || null,
                county: row.County ? String(row.County).trim() : "",
                date: admin.firestore.Timestamp.fromDate(date),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );

            success++;
          } catch (error: any) {
            errors++;
            errorLogs.push(`Row ${i + 1}: ${error.message}`);
          }
        }

        await writeBatch.commit();
      }

      functions.logger.info(`Market prices sync completed: ${success} success, ${errors} errors`);
      if (errorLogs.length > 0) {
        functions.logger.warn("Errors:", errorLogs.slice(0, 10)); // Log first 10 errors
      }

      return { success, errors, total: jsonData.length };
    } catch (error: any) {
      functions.logger.error("Error syncing market prices:", error);
      throw error;
    }
  });

/**
 * Manual trigger function for syncing market prices
 */
export const syncMarketPricesManual = functions.https.onCall(async (data, context) => {
  // Only allow admins or authenticated users in development
  if (process.env.NODE_ENV === "production" && context.auth) {
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== "admin") {
      throw new functions.https.HttpsError("permission-denied", "Admin access required");
    }
  }

  try {
    // Fetch Excel file
    const response = await axios.get(EXCEL_URL, {
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

    let success = 0;
    let errors = 0;

    // Process in batches
    const batchSize = 500;
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      const writeBatch = db.batch();

      for (const row of batch) {
        try {
          if (!row.Commodity || !row.Market || !row.Date) {
            errors++;
            continue;
          }

          const date = parseExcelDate(row.Date);
          const wholesale = parseFloat(String(row.Wholesale)) || 0;
          const retail = parseFloat(String(row.Retail)) || 0;
          const volume = row.Volume ? parseFloat(String(row.Volume)) : undefined;

          if (isNaN(wholesale) || isNaN(retail)) {
            errors++;
            continue;
          }

          const key = generatePriceKey(row.Commodity, row.Market, date);
          const docRef = db.collection("market_prices").doc(key);

          writeBatch.set(
            docRef,
            {
              commodity: String(row.Commodity).trim(),
              classification: row.Classification ? String(row.Classification).trim() : null,
              grade: row.Grade ? String(row.Grade).trim() : null,
              sex: row.Sex ? String(row.Sex).trim() : null,
              market: String(row.Market).trim(),
              wholesale,
              retail,
              supply: row.Supply ? String(row.Supply).trim() : null,
              volume: volume || null,
              county: row.County ? String(row.County).trim() : "",
              date: admin.firestore.Timestamp.fromDate(date),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          success++;
        } catch (error) {
          errors++;
        }
      }

      await writeBatch.commit();
    }

    return { success, errors, total: jsonData.length };
  } catch (error: any) {
    functions.logger.error("Error syncing market prices:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
