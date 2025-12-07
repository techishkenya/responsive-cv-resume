/**
 * Login API Route
 * 
 * POST /api/auth/login
 * Validates the dashboard password and sets an auth cookie.
 * 
 * Security:
 * - Password verified against environment variable (never exposed)
 * - Uses HttpOnly cookie (JavaScript can't read it)
 * - JWT signed for tamper protection
 */

import { NextResponse } from 'next/server';
import { verifyPassword, createAuthToken, getAuthCookieConfig } from '@/lib/utils';

export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body;

        // Verify password
        if (!verifyPassword(password)) {
            // Generic error message to prevent password enumeration
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Create signed JWT token
        const token = createAuthToken();

        // Set HttpOnly cookie
        const response = NextResponse.json({ success: true });
        response.cookies.set('auth_token', token, getAuthCookieConfig(token));

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Login failed' },
            { status: 500 }
        );
    }
}
