/**
 * Logger Utility for Production-Ready Logging
 * 
 * Provides conditional logging based on environment.
 * In production, only warnings and errors are logged.
 * In development, all logs are shown.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /**
   * Log informational messages (development only)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log warning messages (always)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log error messages (always)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log debug messages (development only)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log info messages (development only)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log trace messages (development only)
   */
  trace: (...args: any[]) => {
    if (isDev && console.trace) {
      console.trace(...args);
    }
  },

  /**
   * Log table in development only
   */
  table: (...args: any[]) => {
    if (isDev && console.table) {
      console.table(...args);
    }
  },

  /**
   * Log group in development only
   */
  group: (label: string, fn: () => void) => {
    if (isDev && console.group) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },

  /**
   * Log groupCollapsed in development only
   */
  groupCollapsed: (label: string, fn: () => void) => {
    if (isDev && console.groupCollapsed) {
      console.groupCollapsed(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  },
};

export default logger;
