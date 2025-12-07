/**
 * =============================================================================
 * SECRETS MANAGER
 * =============================================================================
 * 
 * Secure storage for API keys entered via the dashboard.
 * 
 * SECURITY ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * 1. STORAGE: Keys are stored in a separate JSON file (data/secrets.json)
 *    - This file is gitignored and never committed
 *    - File permissions should be restricted on the server
 * 
 * 2. ENCRYPTION: Keys are encrypted before storage using AES-256
 *    - The encryption key comes from JWT_SECRET environment variable
 *    - Even if someone accesses the file, keys are not readable
 * 
 * 3. ACCESS: Only authenticated admin can read/write keys
 *    - Dashboard shows masked version only (e.g., "AIza...xxxx")
 *    - Full key is only used internally by server-side code
 * 
 * 4. TRANSMISSION: Keys sent over HTTPS only
 *    - Vercel and most hosts provide HTTPS by default
 * 
 * WHY THIS IS SECURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * - API keys NEVER appear in browser/client-side code
 * - API keys NEVER appear in public API responses
 * - API keys are encrypted at rest
 * - Only authenticated admins can access
 * - File is gitignored (won't leak to repository)
 * 
 * =============================================================================
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Path to secrets file (gitignored) */
const SECRETS_PATH = path.join(process.cwd(), 'data', 'secrets.json');

/** 
 * Encryption key derived from JWT_SECRET
 * Falls back to a default for development (but warns)
 */
function getEncryptionKey() {
    const secret = process.env.JWT_SECRET || 'default-dev-key-not-secure';

    if (secret === 'default-dev-key-not-secure') {
        logger.warn('Using default encryption key - set JWT_SECRET for production', {
            important: true
        });
    }

    // Create a 32-byte key from the secret using SHA-256
    return crypto.createHash('sha256').update(secret).digest();
}

// =============================================================================
// ENCRYPTION UTILITIES
// =============================================================================

/**
 * Encrypt a string using AES-256-GCM
 * 
 * AES-256-GCM provides:
 * - Confidentiality (only key holder can read)
 * - Integrity (detects if data was tampered)
 * 
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted string (iv:authTag:ciphertext in hex)
 */
function encrypt(text) {
    if (!text) return '';

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(16); // Initialization vector
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Format: iv:authTag:ciphertext
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        logger.error('Encryption failed', { error: error.message });
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt a string encrypted with encrypt()
 * 
 * @param {string} encryptedText - Encrypted string from encrypt()
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
    if (!encryptedText) return '';

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const ciphertext = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        logger.error('Decryption failed', { error: error.message });
        return '';
    }
}

// =============================================================================
// SECRETS FILE OPERATIONS
// =============================================================================

// =============================================================================
// SECRETS FILE OPERATIONS
// =============================================================================

import { kv } from '@vercel/kv';

/**
 * Read secrets from file or KV
 * 
 * @returns {Promise<object>} Secrets object (encrypted values)
 * @private
 */
async function readSecretsFile() {
    // 1. Try Vercel KV
    if (process.env.KV_REST_API_URL) {
        try {
            const data = await kv.get('secrets');
            if (data) return data;
        } catch (error) {
            logger.warn('KV Read Error (Secrets)', { error: error.message });
        }
    }

    // 2. Fallback to File System
    try {
        const content = await fs.readFile(SECRETS_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        logger.error('Error reading secrets file', { error: error.message });
        return {};
    }
}

/**
 * Write secrets to file or KV
 * 
 * @param {object} secrets - Secrets object to write
 * @private
 */
async function writeSecretsFile(secrets) {
    // 1. Try Vercel KV
    if (process.env.KV_REST_API_URL) {
        try {
            await kv.set('secrets', secrets);
            logger.info('Secrets updated in KV', { important: true });
            return;
        } catch (error) {
            logger.error('KV Write Error (Secrets)', { error: error.message });
            throw new Error('Failed to save secrets to database');
        }
    }

    // 2. Fallback to File System
    try {
        const dataDir = path.dirname(SECRETS_PATH);
        await fs.mkdir(dataDir, { recursive: true });
        await fs.writeFile(SECRETS_PATH, JSON.stringify(secrets, null, 2), 'utf-8');
        logger.info('Secrets file updated', { important: true });
    } catch (error) {
        logger.error('Error writing secrets file', { error: error.message });
        throw error;
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get the Gemini API key
 * 
 * Priority:
 * 1. Environment variable (GEMINI_API_KEY) - highest priority
 * 2. Dashboard-entered key (stored in secrets.json)
 * 
 * This allows advanced users to use env vars while others use dashboard.
 * 
 * @returns {Promise<string|null>} The API key or null if not set
 */
export async function getGeminiApiKey() {
    // First, check environment variable (takes priority)
    if (process.env.GEMINI_API_KEY) {
        return process.env.GEMINI_API_KEY;
    }

    // Second, check secrets file (dashboard-entered)
    try {
        const secrets = await readSecretsFile();
        if (secrets.geminiApiKey) {
            return decrypt(secrets.geminiApiKey);
        }
    } catch (error) {
        logger.error('Error reading Gemini API key', { error: error.message });
    }

    return null;
}

/**
 * Set the Gemini API key (from dashboard)
 * 
 * The key is encrypted before storage for security.
 * 
 * @param {string} apiKey - The API key to store
 * @returns {Promise<boolean>} True if successful
 */
export async function setGeminiApiKey(apiKey) {
    try {
        // Validate the key format (basic check)
        if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
            throw new Error('Invalid API key format');
        }

        const secrets = await readSecretsFile();
        secrets.geminiApiKey = encrypt(apiKey);
        secrets.geminiApiKeyUpdatedAt = new Date().toISOString();

        await writeSecretsFile(secrets);

        logger.info('Gemini API key updated via dashboard', { important: true });
        return true;
    } catch (error) {
        logger.error('Failed to save Gemini API key', { error: error.message });
        return false;
    }
}

/**
 * Get masked version of API key for display in dashboard
 * 
 * Returns something like "AIza...xGk4" - enough to identify but not use.
 * 
 * @returns {Promise<string|null>} Masked key or null if not set
 */
export async function getMaskedGeminiApiKey() {
    const key = await getGeminiApiKey();

    if (!key) {
        return null;
    }

    // Show first 4 and last 4 characters
    if (key.length > 12) {
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    }

    return '****';
}

/**
 * Check if API key is configured (either env or dashboard)
 * 
 * @returns {Promise<boolean>}
 */
export async function hasGeminiApiKey() {
    const key = await getGeminiApiKey();
    return !!key && key.length > 0;
}

/**
 * Delete the stored API key
 * 
 * @returns {Promise<boolean>}
 */
export async function deleteGeminiApiKey() {
    try {
        const secrets = await readSecretsFile();
        delete secrets.geminiApiKey;
        delete secrets.geminiApiKeyUpdatedAt;

        await writeSecretsFile(secrets);

        logger.info('Gemini API key deleted', { important: true });
        return true;
    } catch (error) {
        logger.error('Failed to delete Gemini API key', { error: error.message });
        return false;
    }
}

/**
 * Get API key status (for dashboard display)
 * 
 * @returns {Promise<object>} Status object
 */
export async function getApiKeyStatus() {
    const hasEnvKey = !!process.env.GEMINI_API_KEY;
    const maskedKey = await getMaskedGeminiApiKey();
    const hasKey = !!maskedKey;

    return {
        configured: hasKey,
        source: hasEnvKey ? 'environment' : (hasKey ? 'dashboard' : 'none'),
        maskedKey: maskedKey,
        canEdit: !hasEnvKey, // Can only edit via dashboard if not using env var
    };
}
