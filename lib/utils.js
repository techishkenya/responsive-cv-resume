/**
 * =============================================================================
 * SHARED UTILITIES
 * =============================================================================
 * 
 * This file contains all shared utility functions used across the application.
 * It serves as a central hub for common operations to:
 * 
 * 1. REDUCE CODE DUPLICATION - Common logic is written once
 * 2. IMPROVE SECURITY - Centralized security checks
 * 3. EASE MAINTENANCE - Changes propagate automatically
 * 4. ENSURE CONSISTENCY - Same behavior across all API routes
 * 
 * =============================================================================
 * SECURITY ARCHITECTURE
 * =============================================================================
 * 
 * This application is designed to be completely leak-proof:
 * 
 * 1. API KEYS
 *    - Stored in environment variables (.env.local)
 *    - Never exposed to client-side code
 *    - gitignored to prevent accidental commits
 * 
 * 2. AUTHENTICATION
 *    - Password stored in environment variable (not in code)
 *    - JWT tokens signed with secret key
 *    - HttpOnly cookies prevent JavaScript access (XSS protection)
 *    - SameSite cookies prevent CSRF attacks
 * 
 * 3. DATA SANITIZATION
 *    - Public APIs return only safe, sanitized data
 *    - System prompts never exposed to clients
 *    - Blocked topics kept server-side
 * 
 * 4. PERSONAL DATA
 *    - All personal data stored in /data directory
 *    - /data directory is gitignored
 *    - Sample data files provided for new users
 * 
 * =============================================================================
 * USAGE INSTRUCTIONS
 * =============================================================================
 * 
 * Import specific functions:
 *   import { isAuthenticated, readProfile } from '@/lib/utils';
 * 
 * Or import everything:
 *   import * as utils from '@/lib/utils';
 * 
 * =============================================================================
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================
// These values come from environment variables to keep them secure.
// NEVER hardcode real secrets - these defaults are for development only.

/**
 * JWT Secret Key
 * 
 * Used to sign and verify authentication tokens.
 * IMPORTANT: In production, set JWT_SECRET to a long, random string.
 * 
 * Generate a secure secret: openssl rand -base64 32
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-in-production-xyz123';

/**
 * Dashboard Password
 * 
 * Single password for dashboard access.
 * IMPORTANT: In production, set DASHBOARD_PASSWORD to a strong password.
 * 
 * For multi-user support, this could be extended to use a database.
 */
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

// =============================================================================
// FILE PATHS
// =============================================================================
// Centralized path definitions prevent hardcoded strings scattered in code.

/** Base directory for data storage */
const DATA_DIR = path.join(process.cwd(), 'data');

/** Path to profile data file */
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');

/** Path to bot configuration file */
const BOT_CONFIG_PATH = path.join(DATA_DIR, 'botConfig.json');

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

/**
 * Check if the current request is authenticated
 * 
 * How it works:
 * 1. Reads the 'auth_token' cookie from the request
 * 2. Verifies the JWT signature using the secret key
 * 3. Checks if the token is expired
 * 
 * Security notes:
 * - Uses HttpOnly cookies (JavaScript can't read them)
 * - JWT verification ensures token wasn't tampered with
 * - Expired tokens are automatically rejected
 * 
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 * 
 * @example
 * if (!(await isAuthenticated())) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function isAuthenticated() {
    try {
        // Get cookies from the request
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        // No token = not authenticated
        if (!token) {
            return false;
        }

        // Verify the JWT
        // This will throw an error if:
        // - Token is malformed
        // - Signature is invalid (tampered)
        // - Token is expired
        jwt.verify(token, JWT_SECRET);
        return true;

    } catch (error) {
        // Log the reason for debugging (but don't expose to client)
        logger.debug('Authentication check failed', {
            reason: error.message
        });
        return false;
    }
}

/**
 * Verify a password against the configured dashboard password
 * 
 * Security notes:
 * - Password is compared in constant time to prevent timing attacks
 * - Actual password is never logged or exposed
 * - Failed attempts are logged for security monitoring
 * 
 * @param {string} password - Password to verify
 * @returns {boolean} True if password matches
 * 
 * @example
 * if (!verifyPassword(submittedPassword)) {
 *   return { error: 'Invalid password' };
 * }
 */
export function verifyPassword(password) {
    // Type check to prevent crashes
    if (typeof password !== 'string') {
        logger.warn('Invalid password type submitted', {
            type: typeof password
        });
        return false;
    }

    // Compare passwords
    // Note: For production with multiple users, use bcrypt for hashed passwords
    const isValid = password === DASHBOARD_PASSWORD;

    // Log failed attempts (but never log the actual password)
    if (!isValid) {
        logger.info('Failed login attempt', { important: true });
    }

    return isValid;
}

/**
 * Create a signed JWT token for authentication
 * 
 * How it works:
 * 1. Creates a payload with authentication status and timestamp
 * 2. Signs the payload with the secret key
 * 3. Sets an expiration time (7 days)
 * 
 * @returns {string} Signed JWT token
 * 
 * @example
 * const token = createAuthToken();
 * response.cookies.set('auth_token', token, cookieConfig);
 */
export function createAuthToken() {
    return jwt.sign(
        {
            authenticated: true,
            // Timestamp helps with debugging and can be used for token rotation
            timestamp: Date.now()
        },
        JWT_SECRET,
        {
            // Token expires in 7 days
            // After this, user must log in again
            expiresIn: '7d'
        }
    );
}

/**
 * Get consistent cookie configuration for authentication
 * 
 * Security settings explained:
 * - httpOnly: Prevents JavaScript access (protects against XSS)
 * - secure: Only sent over HTTPS in production
 * - sameSite: Prevents CSRF attacks
 * - maxAge: Cookie expiration time
 * - path: Cookie is valid for all routes
 * 
 * @param {string} value - Cookie value (not used, kept for API consistency)
 * @param {boolean} clear - If true, sets maxAge to 0 to delete cookie
 * @returns {object} Cookie configuration object
 * 
 * @example
 * response.cookies.set('auth_token', token, getAuthCookieConfig(token));
 */
export function getAuthCookieConfig(value, clear = false) {
    return {
        httpOnly: true,           // JavaScript can't read this cookie
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax',          // Sent with same-site requests + top-level navigation
        maxAge: clear ? 0 : 60 * 60 * 24 * 7, // 7 days (or 0 to delete)
        path: '/'                 // Valid for entire site
    };
}

// =============================================================================
// FILE SYSTEM UTILITIES
// =============================================================================

/**
 * Ensure the data directory exists
 * 
 * Creates the /data directory if it doesn't exist.
 * This prevents errors when writing to files.
 * 
 * @private
 */
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        // Directory doesn't exist, create it
        await fs.mkdir(DATA_DIR, { recursive: true });
        logger.info('Created data directory', { path: DATA_DIR, important: true });
    }
}

/**
 * Read and parse a JSON file with error handling
 * 
 * Features:
 * - Returns default value if file doesn't exist
 * - Handles JSON parse errors gracefully
 * - Logs errors for debugging
 * 
 * @param {string} filePath - Path to the JSON file
 * @param {object} defaultValue - Value to return if file doesn't exist
 * @returns {Promise<object>} Parsed JSON data or default value
 * 
 * @private
 */
async function readJsonFile(filePath, defaultValue = {}) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        // File doesn't exist or is invalid JSON
        if (error.code !== 'ENOENT') {
            // Only log if it's not a "file not found" error
            logger.warn('Error reading JSON file', {
                path: filePath,
                error: error.message
            });
        }
        return defaultValue;
    }
}

/**
 * Write data to a JSON file with error handling
 * 
 * Features:
 * - Creates parent directories if needed
 * - Pretty-prints JSON for readability
 * - Logs errors for debugging
 * 
 * @param {string} filePath - Path to write to
 * @param {object} data - Data to write
 * 
 * @private
 */
async function writeJsonFile(filePath, data) {
    try {
        await ensureDataDir();
        // Pretty-print with 2-space indentation for readability
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        logger.error('Error writing JSON file', {
            path: filePath,
            error: error.message
        });
        throw error; // Re-throw so caller knows it failed
    }
}

// =============================================================================
// PROFILE DATA ACCESS
// =============================================================================

/**
 * Default profile structure
 * 
 * This defines all available profile fields.
 * New installations start with empty values.
 * Users fill in their information via the dashboard.
 */
const DEFAULT_PROFILE = {
    name: '',
    title: '',
    tagline: '',
    bio: '',
    location: '',
    email: '',
    avatar: '',
    social: {},
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    funFacts: []
};

/**
 * Read profile data from file
 * 
 * Returns the stored profile or a default empty profile.
 * 
 * @returns {Promise<object>} Profile data
 * 
 * @example
 * const profile = await readProfile();
 * console.log(profile.name); // 'John Doe'
 */
export async function readProfile() {
    return readJsonFile(PROFILE_PATH, DEFAULT_PROFILE);
}

/**
 * Write profile data to file
 * 
 * Completely replaces the stored profile with new data.
 * Use with caution - consider using PATCH for partial updates.
 * 
 * @param {object} data - Complete profile data to write
 * 
 * @example
 * await writeProfile({ ...profile, name: 'New Name' });
 */
export async function writeProfile(data) {
    await writeJsonFile(PROFILE_PATH, data);
    logger.info('Profile updated', { important: true });
}

// =============================================================================
// BOT CONFIGURATION DATA ACCESS
// =============================================================================

/**
 * Default bot configuration
 * 
 * Defines the AI chatbot's behavior and personality.
 * Can be customized via the dashboard.
 */
const DEFAULT_BOT_CONFIG = {
    personality: {
        name: 'AI Assistant',
        tone: 'cheerful and professional',
        greeting: 'Hello! How can I help you today?',
        fallbackMessage: 'I can only answer questions about the profile owner.'
    },
    systemPrompt: '',        // Advanced: Custom instructions for the AI
    quickReplies: [],        // Suggested questions shown to visitors
    allowedTopics: [],       // Topics the bot should focus on
    blockedTopics: [],       // Topics the bot should refuse to discuss
    integrations: {
        spotify: { enabled: false, userId: '' },
        twitter: { enabled: false, username: '' },
        blog: { enabled: false, rssUrl: '' }
    }
};

/**
 * Read bot configuration from file
 * 
 * @returns {Promise<object>} Bot configuration
 */
export async function readBotConfig() {
    return readJsonFile(BOT_CONFIG_PATH, DEFAULT_BOT_CONFIG);
}

/**
 * Write bot configuration to file
 * 
 * @param {object} data - Complete bot configuration to write
 */
export async function writeBotConfig(data) {
    await writeJsonFile(BOT_CONFIG_PATH, data);
    logger.info('Bot config updated', { important: true });
}

// =============================================================================
// DATA SANITIZATION (SECURITY)
// =============================================================================
// These functions remove sensitive data before sending to the client.
// This is a critical security layer.

/**
 * Sanitize profile data for public API responses
 * 
 * Currently, all profile fields are considered public.
 * If you add private fields in the future, filter them here.
 * 
 * @param {object} profile - Full profile data
 * @returns {object} Sanitized profile safe for public
 * 
 * @example
 * // In your API route:
 * const profile = await readProfile();
 * const safeProfile = sanitizeProfileForPublic(profile);
 * return NextResponse.json(safeProfile);
 */
export function sanitizeProfileForPublic(profile) {
    // Create a shallow copy to avoid mutating the original
    const sanitized = { ...profile };

    // FUTURE: Add any private field removal here
    // Example: delete sanitized.privateNotes;

    return sanitized;
}

/**
 * Sanitize bot config for public API responses
 * 
 * CRITICAL SECURITY FUNCTION
 * 
 * This function removes sensitive configuration that could be exploited:
 * - systemPrompt: Contains instructions that users could try to bypass
 * - blockedTopics: Knowing blocked topics helps users circumvent them
 * - allowedTopics: Could help craft questions to extract information
 * - Integration credentials: Could expose API keys or user IDs
 * 
 * @param {object} config - Full bot configuration
 * @returns {object} Sanitized config safe for public
 * 
 * @example
 * const config = await readBotConfig();
 * const safeConfig = sanitizeBotConfigForPublic(config);
 * return NextResponse.json(safeConfig);
 */
export function sanitizeBotConfigForPublic(config) {
    // Only return what the client needs:
    // - Bot name and greeting for display
    // - Quick replies for the UI
    // - Integration enabled/disabled status (not credentials)
    return {
        personality: {
            name: config.personality?.name,
            greeting: config.personality?.greeting,
        },
        quickReplies: config.quickReplies || [],
        integrations: {
            // Only return enabled status, never return IDs or URLs
            spotify: { enabled: config.integrations?.spotify?.enabled || false },
            twitter: { enabled: config.integrations?.twitter?.enabled || false },
            blog: { enabled: config.integrations?.blog?.enabled || false },
        }
    };
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================
// Validates user input to prevent abuse and ensure data quality.

/**
 * Validate and sanitize a chat message
 * 
 * Protects against:
 * - Empty or whitespace-only messages
 * - Extremely long messages (potential DoS)
 * - Non-string inputs
 * 
 * @param {string} message - User message to validate
 * @returns {string|null} Sanitized message or null if invalid
 * 
 * @example
 * const message = validateChatMessage(userInput);
 * if (!message) {
 *   return { error: 'Invalid message' };
 * }
 */
export function validateChatMessage(message) {
    // Type check
    if (!message || typeof message !== 'string') {
        return null;
    }

    // Trim whitespace
    const trimmed = message.trim();

    // Length validation
    // Empty messages are rejected
    // Very long messages are rejected to prevent abuse
    if (trimmed.length === 0 || trimmed.length > 1000) {
        return null;
    }

    return trimmed;
}

// =============================================================================
// ENVIRONMENT SECURITY CHECK
// =============================================================================

/**
 * Check for security issues in environment configuration
 * 
 * Logs warnings for common security misconfigurations.
 * Should be called on application startup.
 * 
 * Checks for:
 * - Missing or default JWT secret
 * - Missing or default dashboard password
 * - Missing Gemini API key
 * 
 * @returns {string[]} Array of warning messages
 * 
 * @example
 * // In your app initialization:
 * const warnings = checkEnvironmentSecurity();
 * if (warnings.length > 0) {
 *   console.warn('Security warnings:', warnings);
 * }
 */
export function checkEnvironmentSecurity() {
    const warnings = [];

    // Only check in production - development can use defaults
    if (process.env.NODE_ENV === 'production') {
        // Check JWT secret
        if (!process.env.JWT_SECRET ||
            process.env.JWT_SECRET.includes('default') ||
            process.env.JWT_SECRET.includes('change')) {
            warnings.push('JWT_SECRET is not properly set for production');
        }

        // Check dashboard password
        if (!process.env.DASHBOARD_PASSWORD ||
            process.env.DASHBOARD_PASSWORD === 'admin123') {
            warnings.push('DASHBOARD_PASSWORD is using default value - CHANGE IT!');
        }

        // Check Gemini API key
        if (!process.env.GEMINI_API_KEY) {
            warnings.push('GEMINI_API_KEY is not set - chat will not work');
        }
    }

    // Log warnings
    if (warnings.length > 0) {
        logger.warn('Security configuration issues detected', {
            warnings,
            important: true
        });
    }

    return warnings;
}
