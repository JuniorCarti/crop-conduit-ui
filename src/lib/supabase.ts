/**
 * Supabase Configuration
 * 
 * This file initializes the Supabase client for storage operations.
 * Replace the environment variables with your actual Supabase project credentials.
 * 
 * You can find these in your Supabase Dashboard > Project Settings > API
 */

import { createClient } from "@supabase/supabase-js";

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Supabase features will be disabled."
  );
}

/**
 * Create Supabase client instance
 * Only creates client if configuration is provided
 */
function createSupabaseClient() {
  // Only create client if we have valid configuration
  if (supabaseUrl && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, // We're using Firebase Auth, not Supabase Auth
          autoRefreshToken: false,
        },
      });
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error);
    }
  }
  
  // Return a mock client that satisfies TypeScript but throws when used
  // This is safe because all usage should check isSupabaseConfigured() first
  return {
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
        list: () => Promise.resolve({ data: [], error: null }),
        download: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      }),
    },
  } as any;
}

/**
 * Supabase client instance
 * Used for all Supabase operations including Storage
 */
export const supabase = createSupabaseClient();

/**
 * Storage bucket name
 * All files will be uploaded to this bucket
 */
export const STORAGE_BUCKET = "uploads";

/**
 * Helper function to check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

