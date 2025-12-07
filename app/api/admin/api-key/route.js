/**
 * =============================================================================
 * ADMIN API KEY MANAGEMENT API
 * =============================================================================
 * 
 * Protected API endpoint for managing the Gemini API key via dashboard.
 * 
 * GET /api/admin/api-key
 * Returns the current API key status (masked, not the actual key)
 * 
 * POST /api/admin/api-key
 * Sets a new API key
 * 
 * DELETE /api/admin/api-key
 * Removes the stored API key
 * 
 * SECURITY:
 * - Requires authentication
 * - Never returns the actual API key, only masked version
 * - Keys are encrypted at rest
 * - Only POST receives the full key (over HTTPS)
 * 
 * =============================================================================
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
    getApiKeyStatus,
    setGeminiApiKey,
    deleteGeminiApiKey
} from '@/lib/secrets';

/**
 * GET /api/admin/api-key
 * 
 * Returns the current API key status.
 * NEVER returns the actual key, only:
 * - Whether it's configured
 * - Where it comes from (environment or dashboard)
 * - Masked version for display
 */
export async function GET() {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    if (!(await isAuthenticated())) {
        logger.warn('Unauthorized access attempt to API key status');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const status = await getApiKeyStatus();

        return NextResponse.json({
            success: true,
            ...status
        });

    } catch (error) {
        logger.error('Failed to get API key status', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to get API key status' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/api-key
 * 
 * Sets a new Gemini API key.
 * The key is encrypted before storage.
 * 
 * Request body:
 * { "apiKey": "AIzaSy..." }
 */
export async function POST(request) {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    if (!(await isAuthenticated())) {
        logger.warn('Unauthorized attempt to set API key');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { apiKey } = body;

        // -----------------------------------------------------------------------
        // VALIDATION
        // -----------------------------------------------------------------------
        if (!apiKey || typeof apiKey !== 'string') {
            return NextResponse.json(
                { error: 'API key is required' },
                { status: 400 }
            );
        }

        // Basic format validation for Gemini keys
        if (!apiKey.startsWith('AIza') || apiKey.length < 30) {
            return NextResponse.json(
                { error: 'Invalid API key format. Gemini keys start with "AIza" and are about 39 characters.' },
                { status: 400 }
            );
        }

        // -----------------------------------------------------------------------
        // CHECK IF USING ENVIRONMENT VARIABLE
        // -----------------------------------------------------------------------
        if (process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error: 'API key is set via environment variable. Remove GEMINI_API_KEY from your environment to use dashboard entry.',
                    source: 'environment'
                },
                { status: 400 }
            );
        }

        // -----------------------------------------------------------------------
        // SAVE THE KEY (encrypted)
        // -----------------------------------------------------------------------
        const success = await setGeminiApiKey(apiKey);

        if (success) {
            const status = await getApiKeyStatus();
            return NextResponse.json({
                success: true,
                message: 'API key saved successfully! The chatbot is now ready. 🎉',
                ...status
            });
        } else {
            throw new Error('Failed to save API key');
        }

    } catch (error) {
        logger.error('Failed to set API key', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to save API key. Please try again.' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/api-key
 * 
 * Removes the stored API key.
 * Note: This only removes dashboard-entered keys, not env var keys.
 */
export async function DELETE() {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Check if using environment variable
        if (process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                {
                    error: 'API key is set via environment variable. Remove it from your environment settings.',
                    source: 'environment'
                },
                { status: 400 }
            );
        }

        const success = await deleteGeminiApiKey();

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'API key removed.'
            });
        } else {
            throw new Error('Failed to delete API key');
        }

    } catch (error) {
        logger.error('Failed to delete API key', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to remove API key' },
            { status: 500 }
        );
    }
}
