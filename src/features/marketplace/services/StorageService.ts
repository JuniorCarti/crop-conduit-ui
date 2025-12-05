/**
 * Supabase Storage Service
 * Handles image uploads for listings and chat attachments
 */

import { supabase, STORAGE_BUCKET, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Upload image to Supabase Storage
 * @param file - Image file to upload
 * @param path - Storage path (e.g., "listings")
 * @param userId - User ID for organizing files
 * @returns Public download URL
 */
export async function uploadImage(
  file: File,
  path: string,
  userId: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }

  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("Image size must be less than 10MB");
    }

    // Create storage path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${path}/${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image to Supabase:", error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Error uploading image:", error);
    toast.error(error.message || "Failed to upload image");
    throw error;
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  path: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadImage(file, path, userId)
    );

    const urls = await Promise.all(uploadPromises);
    
    if (onProgress) {
      onProgress(100);
    }

    return urls;
  } catch (error: any) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  try {
    // Extract path from Supabase Storage URL
    // Supabase URLs format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    
    if (!pathMatch || !pathMatch[1]) {
      throw new Error("Invalid image URL");
    }

    const filePath = decodeURIComponent(pathMatch[1]);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image from Supabase:", error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

/**
 * Upload document/file (for chat attachments, dispute evidence)
 */
export async function uploadDocument(
  file: File,
  path: string,
  userId: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Please check your environment variables.");
  }

  try {
    // Validate file size (max 5MB for documents)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 5MB");
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${path}/${userId}/${timestamp}-${sanitizedFileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Error uploading document to Supabase:", error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded document");
    }

    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Error uploading document:", error);
    toast.error(error.message || "Failed to upload document");
    throw error;
  }
}
