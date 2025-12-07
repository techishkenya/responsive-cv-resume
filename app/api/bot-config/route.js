/**
 * Bot Config API Route (Public)
 * 
 * GET /api/bot-config
 * Returns sanitized bot configuration (greeting, quick replies).
 * SECURITY: Does NOT expose system prompts or blocked topics.
 */

import { NextResponse } from 'next/server';
import { readBotConfig, sanitizeBotConfigForPublic } from '@/lib/utils';

// Cache for performance (1 minute)
let cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 60 * 1000;

export async function GET() {
    try {
        const now = Date.now();

        // Return cached data if fresh
        if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
            return NextResponse.json(cache.data);
        }

        // Read and sanitize config
        const config = await readBotConfig();
        const sanitized = sanitizeBotConfigForPublic(config);

        // Update cache
        cache = { data: sanitized, timestamp: now };

        return NextResponse.json(sanitized);
    } catch (error) {
        console.error('Error reading bot config:', error);
        return NextResponse.json({
            personality: {
                name: 'AI Assistant',
                greeting: 'Hello! How can I help you today?',
            },
            quickReplies: [],
            integrations: {}
        });
    }
}
