/**
 * Admin Bot Config API Route
 * 
 * Protected API for managing bot configuration.
 * Requires authentication.
 */

import { NextResponse } from 'next/server';
import { isAuthenticated, readBotConfig, writeBotConfig } from '@/lib/utils';

// Deep merge helper for nested objects
function deepMerge(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}

// GET - Read config (authenticated)
export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const config = await readBotConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error('Error reading config:', error);
        return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
    }
}

// PUT - Replace entire config (authenticated)
export async function PUT(request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const newConfig = await request.json();
        await writeBotConfig(newConfig);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.code === 'READ_ONLY') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('Error writing config:', error);
        return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }
}

// PATCH - Update specific fields with deep merge (authenticated)
export async function PATCH(request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const updates = await request.json();
        const currentConfig = await readBotConfig();
        const updatedConfig = deepMerge(currentConfig, updates);

        await writeBotConfig(updatedConfig);
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error.code === 'READ_ONLY') {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
        console.error('Error updating config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
