/**
 * AgriSmart Environment Validation
 *
 * Validates required environment variables at startup.
 * Prevents silent runtime failures from missing configuration.
 */

import { logger } from './logger';

interface EnvVar {
  key: string;
  required: boolean;
  description: string;
}

const ENV_SCHEMA: EnvVar[] = [
  // Firebase (required)
  { key: 'VITE_FIREBASE_API_KEY', required: true, description: 'Firebase API key' },
  { key: 'VITE_FIREBASE_AUTH_DOMAIN', required: true, description: 'Firebase auth domain' },
  { key: 'VITE_FIREBASE_PROJECT_ID', required: true, description: 'Firebase project ID' },
  { key: 'VITE_FIREBASE_STORAGE_BUCKET', required: true, description: 'Firebase storage bucket' },
  { key: 'VITE_FIREBASE_APP_ID', required: true, description: 'Firebase app ID' },

  // External APIs (optional — features degrade gracefully)
  { key: 'VITE_WEATHER_PROXY_URL', required: false, description: 'Weather proxy worker URL' },
  { key: 'VITE_ADVISORY_WORKER_URL', required: false, description: 'Advisory AI worker URL' },
  { key: 'VITE_MARKET_API_URL', required: false, description: 'Market forecaster API URL' },
  { key: 'VITE_COMMUNITY_API_BASE_URL', required: false, description: 'Community backend API URL' },
  { key: 'VITE_ASHA_API_BASE_URL', required: false, description: 'ASHA voice API URL' },
];

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate environment variables at startup.
 * Call this in main.tsx before rendering the app.
 */
export function validateEnvironment(): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of ENV_SCHEMA) {
    const value = import.meta.env[envVar.key];
    const isEmpty = !value || value === '' || value.startsWith('your-');

    if (envVar.required && isEmpty) {
      missing.push(`${envVar.key} (${envVar.description})`);
    } else if (!envVar.required && isEmpty) {
      warnings.push(`${envVar.key} not set — ${envVar.description} will be unavailable`);
    }
  }

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
  }

  if (warnings.length > 0) {
    logger.warn('Optional environment variables not configured', { warnings });
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}
