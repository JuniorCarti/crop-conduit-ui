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
    "Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
  );
}

/**
 * Supabase client instance
 * Used for all Supabase operations including Storage
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Firebase Auth, not Supabase Auth
    autoRefreshToken: false,
  },
});

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

