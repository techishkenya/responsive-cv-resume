/**
 * Profile API Route (Public)
 * 
 * GET /api/profile
 * Returns the public profile data for display on the chatbot page.
 */

import { NextResponse } from 'next/server';
import { readProfile, sanitizeProfileForPublic } from '@/lib/utils';

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

        // Read and sanitize profile
        const profile = await readProfile();
        const sanitized = sanitizeProfileForPublic(profile);

        // Update cache
        cache = { data: sanitized, timestamp: now };

        return NextResponse.json(sanitized);
    } catch (error) {
        console.error('Error reading profile:', error);
        return NextResponse.json({
            name: 'Your Name',
            title: 'Your Title',
            tagline: 'Your tagline here',
            bio: 'Tell visitors about yourself',
            avatar: '/avatar.png',
            social: {}
        });
    }
}
