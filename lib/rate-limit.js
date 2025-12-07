
import { logger } from './logger';

/**
 * Simple in-memory rate limiter
 * 
 * Uses a sliding window algorithm to limit requests per IP.
 * Note: Memory is cleared on server restart. For persistent limiting
 * across restarts/scaling, use Redis or similar.
 */

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;   // 10 requests per minute (increased for usability)
const MAX_DAILY_REQUESTS = 100;       // 100 requests per day (safety cap)

const requests = new Map();
const dailyRequests = new Map();

/**
 * Check if a request is allowed
 * @param {string} ip - User IP address
 * @returns {object} { allowed: boolean, error: string }
 */
export function checkRateLimit(ip) {
    const now = Date.now();

    // 1. Check daily limit (clears every 24h roughly)
    // We use a simplified daily check that resets if the last request was > 24h ago
    const dailyRecord = dailyRequests.get(ip) || { count: 0, startTime: now };

    if (now - dailyRecord.startTime > 24 * 60 * 60 * 1000) {
        // Reset daily limit
        dailyRequests.set(ip, { count: 1, startTime: now });
    } else {
        if (dailyRecord.count >= MAX_DAILY_REQUESTS) {
            logger.warn('Daily rate limit exceeded', { ip });
            return {
                allowed: false,
                error: 'You have reached the daily message limit. Please try again tomorrow! 🌙'
            };
        }
        dailyRecord.count++;
        dailyRequests.set(ip, dailyRecord);
    }

    // 2. Check minute window limit
    // Get requests for this IP
    let userRequests = requests.get(ip) || [];

    // Filter out old requests outside the window
    userRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

    // Check if limit exceeded
    if (userRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        logger.warn('Rate limit exceeded', { ip });
        return {
            allowed: false,
            error: 'Whoa, slow down! 🚦 Too many messages too fast. Please wait a moment.'
        };
    }

    // Add current request
    userRequests.push(now);
    requests.set(ip, userRequests);

    // Periodic cleanup (every 100 requests globally) to prevent memory leaks
    if (requests.size > 1000) {
        cleanup();
    }

    return { allowed: true };
}

function cleanup() {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
        const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
        if (valid.length === 0) {
            requests.delete(ip);
        } else {
            requests.set(ip, valid);
        }
    }
}
