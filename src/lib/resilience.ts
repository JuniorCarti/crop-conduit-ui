/**
 * AgriSmart Resilience Utilities
 *
 * Operational safeguards for external API calls:
 * - Retry with exponential backoff
 * - Timeout protection
 * - Circuit breaker pattern (simplified)
 * - Graceful fallbacks
 */

import { RETRY, TIMEOUTS } from './serviceConfig';
import { logger } from './logger';

// ─── Retry with Exponential Backoff ──────────────────────────────────────────

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    label?: string;
  } = {}
): Promise<T> {
  const {
    maxAttempts = RETRY.maxAttempts,
    baseDelay = RETRY.baseDelay,
    maxDelay = RETRY.maxDelay,
    label = 'operation',
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxAttempts) break;

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Retry ${attempt}/${maxAttempts} for ${label}`, {
        error: error?.message,
        nextRetryMs: delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ─── Timeout Protection ──────────────────────────────────────────────────────

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = TIMEOUTS.default,
  label = 'operation'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      logger.error(`Timeout: ${label} exceeded ${timeoutMs}ms`);
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ─── Circuit Breaker (Simplified) ────────────────────────────────────────────

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuits = new Map<string, CircuitState>();

const CIRCUIT_THRESHOLD = 5; // failures before opening
const CIRCUIT_RESET_MS = 30_000; // 30 seconds before half-open

export async function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: { name: string; fallback?: T }
): Promise<T> {
  const { name, fallback } = options;
  const state = circuits.get(name) || { failures: 0, lastFailure: 0, isOpen: false };

  // Check if circuit should reset (half-open)
  if (state.isOpen && Date.now() - state.lastFailure > CIRCUIT_RESET_MS) {
    state.isOpen = false;
    state.failures = 0;
  }

  // Circuit is open — fail fast
  if (state.isOpen) {
    logger.warn(`Circuit breaker OPEN for ${name} — using fallback`);
    if (fallback !== undefined) return fallback;
    throw new Error(`Service ${name} is temporarily unavailable`);
  }

  try {
    const result = await fn();
    // Success — reset failures
    state.failures = 0;
    state.isOpen = false;
    circuits.set(name, state);
    return result;
  } catch (error: any) {
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= CIRCUIT_THRESHOLD) {
      state.isOpen = true;
      logger.error(`Circuit breaker OPENED for ${name} after ${state.failures} failures`);
    }

    circuits.set(name, state);

    if (fallback !== undefined) return fallback;
    throw error;
  }
}

// ─── Safe Fetch (combines timeout + retry) ───────────────────────────────────

export async function safeFetch(
  url: string,
  options: RequestInit & {
    timeoutMs?: number;
    retries?: number;
    label?: string;
  } = {}
): Promise<Response> {
  const { timeoutMs = TIMEOUTS.default, retries = RETRY.maxAttempts, label = url, ...fetchOptions } = options;

  return withRetry(
    () => withTimeout(() => fetch(url, fetchOptions), timeoutMs, label),
    { maxAttempts: retries, label }
  );
}
