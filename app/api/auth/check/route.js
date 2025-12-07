/**
 * Auth Check API Route
 * 
 * GET /api/auth/check
 * Verifies if the current session is authenticated.
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/utils';

export async function GET() {
    try {
        const authenticated = await isAuthenticated();
        return NextResponse.json({ authenticated });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
