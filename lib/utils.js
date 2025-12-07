/**
 * =============================================================================
 * SHARED UTILITIES
 * =============================================================================
 * 
 * This file contains all shared utility functions used across the application.
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'default-dev-secret-change-in-production-xyz123';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || 'admin123';

// =============================================================================
// FILE PATHS
// =============================================================================

const DATA_DIR = path.join(process.cwd(), 'data');
const PROFILE_PATH = path.join(DATA_DIR, 'profile.json');
const BOT_CONFIG_PATH = path.join(DATA_DIR, 'botConfig.json');

// =============================================================================
// AUTHENTICATION UTILITIES
// =============================================================================

export async function isAuthenticated() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return false;

        jwt.verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        logger.debug('Authentication check failed', { reason: error.message });
        return false;
    }
}

export function verifyPassword(password) {
    if (typeof password !== 'string') return false;
    const isValid = password === DASHBOARD_PASSWORD;
    if (!isValid) logger.info('Failed login attempt', { important: true });
    return isValid;
}

export function createAuthToken() {
    return jwt.sign(
        { authenticated: true, timestamp: Date.now() },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function getAuthCookieConfig(value, clear = false) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: clear ? 0 : 60 * 60 * 24 * 7,
        path: '/'
    };
}

// =============================================================================
// FILE SYSTEM & DATABASE UTILITIES (HYBRID STORAGE)
// =============================================================================

import { createClient } from '@vercel/kv';

// Robust client that works with Vercel KV OR standard Upstash Redis
export const kv = createClient({
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Check if ANY database connection is available
export const HAS_KV = !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

/**
 * Helper to get the KV key for a file path
 */
function getKvKey(filePath) {
    if (filePath.includes('profile.json')) return 'profile';
    if (filePath.includes('botConfig.json')) return 'bot_config';
    if (filePath.includes('secrets.json')) return 'secrets'; // Handled in secrets.js
    return null;
}

async function readJsonFile(filePath, defaultValue = {}) {
    // 1. Try Vercel KV (Production/Live)
    if (HAS_KV) {
        const key = getKvKey(filePath);
        if (key) {
            try {
                const data = await kv.get(key);
                if (data) return data;
            } catch (error) {
                logger.warn('KV Read Error', { error: error.message });
            }
        }
    }

    // 2. Fallback to File System (Local Dev or Initial Seed)
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            logger.warn('Error reading JSON file', { path: filePath, error: error.message });
        }
        return defaultValue;
    }
}

async function writeJsonFile(filePath, data) {
    // 1. Try Vercel KV (Production/Live)
    if (HAS_KV) {
        const key = getKvKey(filePath);
        if (key) {
            try {
                await kv.set(key, data);
            } catch (error) {
                logger.error('KV Write Error', { error: error.message });
                throw new Error('Failed to save to database');
            }
            return; // Success on KV
        }
    }

    // 2. File System (Local Dev)
    // On Vercel, this might fail (Read-Only), so we catch it.
    try {
        await ensureDataDir();
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        // If on Vercel and KV is missing, explain the solution
        if (process.env.NODE_ENV === 'production' && !HAS_KV) {
            const newErr = new Error("Live editing requires database. Enable Storage (KV/Upstash) to save changes.");
            newErr.code = 'NO_KV';
            throw newErr;
        }

        logger.error('Error writing JSON file', { path: filePath, error: error.message });
        throw error;
    }
}

// =============================================================================
// PROFILE DATA ACCESS
// =============================================================================

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

export async function readProfile() {
    return readJsonFile(PROFILE_PATH, DEFAULT_PROFILE);
}

export async function writeProfile(data) {
    await writeJsonFile(PROFILE_PATH, data);
    logger.info('Profile updated', { important: true });
}

// =============================================================================
// BOT CONFIGURATION DATA ACCESS
// =============================================================================

const DEFAULT_BOT_CONFIG = {
    personality: {
        name: 'AI Assistant',
        tone: 'cheerful and professional',
        greeting: 'Hello! How can I help you today?',
        fallbackMessage: 'I can only answer questions about the profile owner.'
    },
    systemPrompt: '',
    quickReplies: [],
    allowedTopics: [],
    blockedTopics: [],
    integrations: {
        playlists: { enabled: false, items: [] },
        twitter: { enabled: false, username: '' },
        blog: { enabled: false, rssUrl: '' }
    }
};

export async function readBotConfig() {
    return readJsonFile(BOT_CONFIG_PATH, DEFAULT_BOT_CONFIG);
}

export async function writeBotConfig(data) {
    await writeJsonFile(BOT_CONFIG_PATH, data);
    logger.info('Bot config updated', { important: true });
}

// =============================================================================
// DATA SANITIZATION
// =============================================================================

export function sanitizeProfileForPublic(profile) {
    return { ...profile };
}

export function sanitizeBotConfigForPublic(config) {
    return {
        personality: {
            name: config.personality?.name,
            greeting: config.personality?.greeting,
        },
        quickReplies: config.quickReplies || [],
        integrations: {
            playlists: { enabled: config.integrations?.playlists?.enabled || false },
            twitter: { enabled: config.integrations?.twitter?.enabled || false },
            blog: { enabled: config.integrations?.blog?.enabled || false },
        }
    };
}

// =============================================================================
// INPUT VALIDATION
// =============================================================================

export function validateChatMessage(message) {
    if (!message || typeof message !== 'string') return null;
    const trimmed = message.trim();
    if (trimmed.length === 0 || trimmed.length > 1000) return null;
    return trimmed;
}

// =============================================================================
// ENVIRONMENT SECURITY CHECK
// =============================================================================

export function checkEnvironmentSecurity() {
    const warnings = [];
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('default')) {
            warnings.push('JWT_SECRET is not properly set for production');
        }
        if (!process.env.DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD === 'admin123') {
            warnings.push('DASHBOARD_PASSWORD is using default value - CHANGE IT!');
        }
        if (!process.env.GEMINI_API_KEY) {
            warnings.push('GEMINI_API_KEY is not set - chat will not work');
        }
    }
    if (warnings.length > 0) {
        logger.warn('Security configuration issues detected', { warnings, important: true });
    }
    return warnings;
}
