/**
 * AgriSmart Centralized Logger
 *
 * Structured logging utility for the frontend application.
 * Provides consistent severity levels, context tagging, and
 * a single point to route logs to external services (Sentry, etc.)
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User logged in', { uid: '123', role: 'farmer' });
 *   logger.error('Payment failed', { orderId, error });
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  service: string;
}

type LogTransport = (entry: LogEntry) => void;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private service: string;
  private minLevel: LogLevel;
  private transports: LogTransport[] = [];

  constructor(service = 'agrismart-web') {
    this.service = service;
    this.minLevel = import.meta.env.DEV ? 'debug' : 'warn';

    // Default transport: console (dev only for debug/info)
    this.transports.push(this.consoleTransport);
  }

  private consoleTransport: LogTransport = (entry) => {
    const { level, message, context, timestamp } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.service}]`;

    switch (level) {
      case 'debug':
        if (import.meta.env.DEV) console.debug(prefix, message, context || '');
        break;
      case 'info':
        if (import.meta.env.DEV) console.info(prefix, message, context || '');
        break;
      case 'warn':
        console.warn(prefix, message, context || '');
        break;
      case 'error':
        console.error(prefix, message, context || '');
        break;
    }
  };

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      service: this.service,
    };

    for (const transport of this.transports) {
      try {
        transport(entry);
      } catch {
        // Never let logging crash the app
      }
    }
  }

  /** Add external transport (Sentry, CloudWatch, etc.) */
  addTransport(transport: LogTransport) {
    this.transports.push(transport);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.emit('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.emit('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.emit('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.emit('error', message, context);
  }

  /** Create a child logger with a specific service name */
  child(service: string): Logger {
    const child = new Logger(service);
    child.transports = this.transports;
    child.minLevel = this.minLevel;
    return child;
  }
}

export const logger = new Logger('agrismart-web');

// Domain-specific loggers
export const authLogger = logger.child('auth');
export const marketLogger = logger.child('market-oracle');
export const paymentLogger = logger.child('payments');
export const climateLogger = logger.child('climate');
export const transportLogger = logger.child('transport');
