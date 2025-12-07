/**
 * =============================================================================
 * ADMIN ERROR LOGS API
 * =============================================================================
 * 
 * Protected API endpoint for viewing system error logs.
 * Only authenticated admins can access this endpoint.
 * 
 * GET /api/admin/errors
 * Returns recent error logs with optional filtering
 * 
 * Query Parameters:
 * - limit: Number of logs to return (default: 50, max: 100)
 * - level: Filter by level (error, warn, info)
 * 
 * DELETE /api/admin/errors
 * Clears all error logs
 * 
 * SECURITY:
 * - Requires authentication
 * - Logs are sanitized (no API keys, passwords, tokens)
 * - Limited log retention prevents memory issues
 * 
 * =============================================================================
 */

import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/utils';
import { getRecentErrors, getErrorSummary, clearErrorLogs, logger } from '@/lib/logger';

/**
 * GET /api/admin/errors
 * 
 * Retrieves recent error logs for the admin dashboard.
 * Useful for debugging production issues without accessing server logs.
 */
export async function GET(request) {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    // Verify the request comes from an authenticated admin
    // This prevents unauthorized users from seeing system errors
    if (!(await isAuthenticated())) {
        logger.warn('Unauthorized access attempt to error logs', {
            ip: request.headers.get('x-forwarded-for') || 'unknown'
        });
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // -----------------------------------------------------------------------
        // PARSE QUERY PARAMETERS
        // -----------------------------------------------------------------------
        const { searchParams } = new URL(request.url);

        // Limit: how many logs to return (max 100 to prevent large responses)
        let limit = parseInt(searchParams.get('limit') || '50', 10);
        limit = Math.min(Math.max(1, limit), 100); // Clamp between 1-100

        // Level: filter by log level
        const level = searchParams.get('level') || null;
        const validLevels = ['error', 'warn', 'info'];
        const filterLevel = validLevels.includes(level) ? level : null;

        // -----------------------------------------------------------------------
        // FETCH AND RETURN LOGS
        // -----------------------------------------------------------------------
        const logs = getRecentErrors(limit, filterLevel);
        const summary = getErrorSummary();

        return NextResponse.json({
            success: true,
            summary,
            logs,
            meta: {
                limit,
                filterLevel,
                returnedCount: logs.length,
            }
        });

    } catch (error) {
        logger.error('Failed to fetch error logs', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/errors
 * 
 * Clears all error logs from memory.
 * Use with caution - this action cannot be undone.
 */
export async function DELETE() {
    // -------------------------------------------------------------------------
    // AUTHENTICATION CHECK
    // -------------------------------------------------------------------------
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        clearErrorLogs();

        return NextResponse.json({
            success: true,
            message: 'All error logs cleared'
        });

    } catch (error) {
        logger.error('Failed to clear error logs', { error: error.message });
        return NextResponse.json(
            { error: 'Failed to clear logs' },
            { status: 500 }
        );
    }
}
