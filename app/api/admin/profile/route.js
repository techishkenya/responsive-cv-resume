/**
 * Admin Profile API Route
 * 
 * Protected API for managing profile data.
 * Requires authentication.
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, readProfile, writeProfile } from '@/lib/utils';

// GET - Read profile (authenticated)
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const profile = await readProfile();
        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error reading profile:', error);
        return NextResponse.json({ error: 'Failed to read profile' }, { status: 500 });
    }
}

// PUT - Replace entire profile (authenticated)
export async function PUT(request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const newProfile = await request.json();
        await writeProfile(newProfile);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.code === 'READ_ONLY') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('Error writing profile:', error);
        return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }
}

// PATCH - Update specific fields (authenticated)
export async function PATCH(request) {
    if (!(await isAuthenticated())) {
        console.log('[PATCH] Unauthorized request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const updates = await request.json();
        console.log('[PATCH] Updates received:', Object.keys(updates));

        const currentProfile = await readProfile();
        const updatedProfile = { ...currentProfile, ...updates };

        await writeProfile(updatedProfile);
        console.log('[PATCH] Profile updated successfully');
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.code === 'READ_ONLY') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('[PATCH] Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
