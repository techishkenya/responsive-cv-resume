/**
 * Logout API Route
 * 
 * POST /api/auth/logout
 * Clears the auth cookie to end the session.
 */

import { NextResponse } from 'next/server';
import { getAuthCookieConfig } from '@/lib/utils';

export async function POST() {
    try {
        const response = NextResponse.json({ success: true });

        // Clear cookie by setting with immediate expiration
        response.cookies.set('auth_token', '', getAuthCookieConfig('', true));

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Logout failed' },
            { status: 500 }
        );
    }
}
