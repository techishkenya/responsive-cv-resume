/**
 * =============================================================================
 * LOGGING UTILITY
 * =============================================================================
 * 
 * Centralized logging system for error tracking and debugging.
 * 
 * Features:
 * - Error logging with timestamps and context
 * - Log levels (error, warn, info, debug)
 * - Safe logging that never exposes sensitive data
 * - Admin-viewable error logs
 * 
 * SECURITY NOTES:
 * - Never logs API keys, passwords, or tokens
 * - Sanitizes user input before logging
 * - Logs are stored in memory (not persisted to prevent data leaks)
 * - In production, consider integrating with a logging service
 * 
 * USAGE:
 *   import { logger, getRecentErrors } from '@/lib/logger';
 *   logger.error('Something went wrong', { userId: '123', action: 'login' });
 *   const errors = getRecentErrors(); // For admin dashboard
 * 
 * =============================================================================
 */

// Maximum number of errors to keep in memory
// Prevents memory leaks while maintaining useful history
const MAX_ERROR_LOG_SIZE = 100;

// In-memory error storage (resets on server restart)
// This is intentional - we don't want to persist sensitive error data
const errorLog = [];

/**
 * List of sensitive keys that should NEVER appear in logs
 * These patterns will be redacted from any logged data
 */
const SENSITIVE_KEYS = [
    'password',
    'api_key',
    'apiKey',
    'API_KEY',
    'GEMINI_API_KEY',
    'JWT_SECRET',
    'token',
    'auth_token',
    'secret',
    'authorization',
    'cookie',
    'session',
];

/**
 * Sanitize an object by redacting sensitive fields
 * This ensures no API keys, passwords, or tokens are ever logged
 * 
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth (prevents infinite loops)
 * @returns {any} Sanitized object safe for logging
 */
function sanitizeForLogging(obj, depth = 0) {
    // Prevent infinite recursion
    if (depth > 5) return '[MAX_DEPTH_EXCEEDED]';

    // Handle null/undefined
    if (obj === null || obj === undefined) return obj;

    // Handle primitives
    if (typeof obj !== 'object') {
        // Truncate very long strings (could be base64 tokens)
        if (typeof obj === 'string' && obj.length > 500) {
            return obj.substring(0, 100) + '...[TRUNCATED]';
        }
        return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.slice(0, 10).map(item => sanitizeForLogging(item, depth + 1));
    }

    // Handle objects
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        // Check if this key contains sensitive information
        const isSensitive = SENSITIVE_KEYS.some(
            sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase())
        );

        if (isSensitive) {
            sanitized[key] = '[REDACTED]';
        } else {
            sanitized[key] = sanitizeForLogging(value, depth + 1);
        }
    }

    return sanitized;
}

/**
 * Format an error object for logging
 * Extracts useful information while keeping sensitive data safe
 * 
 * @param {Error|any} error - The error to format
 * @returns {object} Formatted error object
 */
function formatError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            // Only include stack in development to avoid leaking code structure
            stack: process.env.NODE_ENV === 'development'
                ? error.stack?.split('\n').slice(0, 5).join('\n')
                : '[STACK_HIDDEN_IN_PRODUCTION]',
        };
    }
    return sanitizeForLogging(error);
}

/**
 * Add an entry to the error log
 * Maintains a fixed-size circular buffer to prevent memory issues
 * 
 * @param {string} level - Log level (error, warn, info, debug)
 * @param {string} message - Human-readable error message
 * @param {object} context - Additional context (will be sanitized)
 */
function addToErrorLog(level, message, context) {
    const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        level,
        message,
        context: sanitizeForLogging(context),
    };

    // Add to beginning (newest first)
    errorLog.unshift(entry);

    // Keep only the most recent errors
    while (errorLog.length > MAX_ERROR_LOG_SIZE) {
        errorLog.pop();
    }
}

/**
 * Logger object with methods for different log levels
 * 
 * Each method:
 * 1. Sanitizes the data to remove sensitive information
 * 2. Logs to console in development
 * 3. Stores in memory for admin access
 */
export const logger = {
    /**
     * Log an error - use for exceptions and failures
     * These are the most important logs for debugging
     */
    error: (message, context = {}) => {
        const sanitizedContext = sanitizeForLogging(context);
        console.error(`[ERROR] ${message}`, sanitizedContext);
        addToErrorLog('error', message, context);
    },

    /**
     * Log a warning - use for unexpected but handled situations
     * e.g., deprecated usage, rate limiting, validation failures
     */
    warn: (message, context = {}) => {
        const sanitizedContext = sanitizeForLogging(context);
        console.warn(`[WARN] ${message}`, sanitizedContext);
        addToErrorLog('warn', message, context);
    },

    /**
     * Log info - use for important events
     * e.g., user login, configuration changes
     */
    info: (message, context = {}) => {
        const sanitizedContext = sanitizeForLogging(context);
        console.info(`[INFO] ${message}`, sanitizedContext);
        // Only store info logs if they seem important
        if (context.important) {
            addToErrorLog('info', message, context);
        }
    },

    /**
     * Log debug - use for development troubleshooting
     * Only logs in development environment
     */
    debug: (message, context = {}) => {
        if (process.env.NODE_ENV === 'development') {
            const sanitizedContext = sanitizeForLogging(context);
            console.debug(`[DEBUG] ${message}`, sanitizedContext);
        }
    },
};

/**
 * Get recent error logs for admin dashboard
 * Returns sanitized logs that are safe to display
 * 
 * @param {number} limit - Maximum number of logs to return
 * @param {string} level - Optional filter by log level
 * @returns {Array} Array of log entries
 */
export function getRecentErrors(limit = 50, level = null) {
    let logs = errorLog;

    // Filter by level if specified
    if (level) {
        logs = logs.filter(log => log.level === level);
    }

    // Return limited number
    return logs.slice(0, limit);
}

/**
 * Clear error logs
 * Should only be accessible to authenticated admins
 */
export function clearErrorLogs() {
    errorLog.length = 0;
    logger.info('Error logs cleared by admin', { important: true });
}

/**
 * Get a summary of error counts by level
 * Useful for dashboard overview
 * 
 * @returns {object} Count of errors by level
 */
export function getErrorSummary() {
    const summary = {
        total: errorLog.length,
        error: 0,
        warn: 0,
        info: 0,
    };

    for (const log of errorLog) {
        if (summary[log.level] !== undefined) {
            summary[log.level]++;
        }
    }

    return summary;
}

// Export sanitize function for use elsewhere
export { sanitizeForLogging };
