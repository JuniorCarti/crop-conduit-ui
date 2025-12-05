/**
 * Supabase Storage Service
 * 
 * This service provides functions to upload, fetch, and delete files using Supabase Storage.
 * It replaces Firebase Storage functionality throughout the application.
 * 
 * All files are stored in the 'uploads' bucket and organized by user ID and file type.
 */

import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Upload a file to Supabase Storage
 * 
 * @param file - The file to upload
 * @param path - The path within the bucket (e.g., "farm-photos/user-id/filename.jpg")
 * @param userId - The user ID for organizing files
 * @param options - Optional upload options
 * @returns The public URL of the uploaded file
 * 
 * @example
 * const url = await uploadFile(file, "farm-photos", userId);
 */
export async function uploadFile(
  file: File,
  path: string,
  userId: string,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }

  try {
    // Construct the full path: {path}/{userId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${path}/${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: options?.cacheControl || "3600",
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false,
      });

    if (error) {
      console.error("Error uploading file to Supabase:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Error in uploadFile:", error);
    toast.error(error.message || "Failed to upload file");
    throw error;
  }
}

/**
 * Upload an image file (with automatic image optimization path)
 * 
 * @param file - The image file to upload
 * @param category - The category/folder (e.g., "farm-photos", "crop-photos")
 * @param userId - The user ID
 * @returns The public URL of the uploaded image
 * 
 * @example
 * const url = await uploadImage(file, "farm-photos", userId);
 */
export async function uploadImage(
  file: File,
  category: string,
  userId: string
): Promise<string> {
  // Validate that it's an image
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("Image size must be less than 10MB");
  }

  return uploadFile(file, category, userId, {
    contentType: file.type,
    cacheControl: "3600",
  });
}

/**
 * Get the public URL of a file
 * 
 * @param path - The path to the file in the bucket
 * @returns The public URL
 * 
 * @example
 * const url = getPublicUrl("farm-photos/user-id/filename.jpg");
 */
export function getPublicUrl(path: string): string {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param path - The path to the file in the bucket
 * @returns True if successful
 * 
 * @example
 * await deleteFile("farm-photos/user-id/filename.jpg");
 */
export async function deleteFile(path: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error("Error deleting file from Supabase:", error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return true;
  } catch (error: any) {
    console.error("Error in deleteFile:", error);
    toast.error(error.message || "Failed to delete file");
    throw error;
  }
}

/**
 * List files in a directory
 * 
 * @param path - The directory path
 * @param userId - Optional user ID to filter by
 * @returns Array of file information
 */
export async function listFiles(
  path: string,
  userId?: string
): Promise<Array<{ name: string; id: string; updated_at: string }>> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const fullPath = userId ? `${path}/${userId}` : path;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(fullPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error listing files from Supabase:", error);
      throw new Error(`Failed to list files: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    console.error("Error in listFiles:", error);
    throw error;
  }
}

/**
 * Download a file as a blob
 * 
 * @param path - The path to the file
 * @returns The file as a Blob
 */
export async function downloadFile(path: string): Promise<Blob> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(path);

    if (error) {
      console.error("Error downloading file from Supabase:", error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from download");
    }

    return data;
  } catch (error: any) {
    console.error("Error in downloadFile:", error);
    throw error;
  }
}

/**
 * Check if a file exists
 * 
 * @param path - The path to the file
 * @returns True if the file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop() || "",
      });

    if (error) {
      return false;
    }

    return (data || []).some((file) => file.name === path.split("/").pop());
  } catch (error) {
    return false;
  }
}

/**
 * Storage categories for organizing files
 */
export const STORAGE_CATEGORIES = {
  FARM_PHOTOS: "farm-photos",
  CROP_PHOTOS: "crop-photos",
  DOCUMENTS: "documents",
  PROFILE_PICTURES: "profile-pictures",
  REPORTS: "reports",
  // Finance/Chancellor categories
  LOAN_DOCUMENTS: "loan-documents", // Loan application documents
  FINANCIAL_REPORTS: "financial-reports", // Financial statements, P&L reports
  BANK_STATEMENTS: "bank-statements", // Bank statements for loan applications
  // Irrigation Scheduler categories
  IRRIGATION_WEATHER: "irrigation-weather", // Weather forecast charts
  IRRIGATION_SENSORS: "irrigation-sensors", // IoT sensor data and images
  IRRIGATION_REPORTS: "irrigation-reports", // Cost-benefit analysis reports
  WATER_SOURCE_PHOTOS: "water-source-photos", // Water source photos
  WATER_SOURCE_DOCS: "water-source-docs", // Water source documents
  WATER_SOURCE_LOGS: "water-source-logs", // Sensor logs and maintenance records
  EFFICIENCY_CHARTS: "efficiency-charts", // Efficiency analysis charts
  EFFICIENCY_REPORTS: "efficiency-reports", // Efficiency reports
} as const;

export type StorageCategory = typeof STORAGE_CATEGORIES[keyof typeof STORAGE_CATEGORIES];

