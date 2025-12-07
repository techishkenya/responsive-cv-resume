/**
 * =============================================================================
 * DASHBOARD ERROR LOGS PAGE
 * =============================================================================
 * 
 * Admin page for viewing system error logs.
 * 
 * Features:
 * - View recent errors, warnings, and info logs
 * - Filter by log level
 * - Clear logs
 * - Real-time updates
 * 
 * Security:
 * - Only accessible to authenticated admins
 * - Logs are sanitized (no API keys, passwords, or tokens)
 * 
 * =============================================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

/**
 * Error Logs Dashboard Page Component
 */
export default function ErrorLogsPage() {
    // ===========================================================================
    // STATE MANAGEMENT
    // ===========================================================================

    /**
     * Error logs data
     * Contains the actual log entries from the server
     */
    const [logs, setLogs] = useState([]);

    /**
     * Summary statistics
     * Counts of each log type (error, warn, info)
     */
    const [summary, setSummary] = useState({ total: 0, error: 0, warn: 0, info: 0 });

    /**
     * Current filter level
     * null = show all, or 'error'/'warn'/'info'
     */
    const [filter, setFilter] = useState(null);

    /**
     * Loading state for UX
     */
    const [isLoading, setIsLoading] = useState(true);

    /**
     * Status messages for user feedback
     */
    const [message, setMessage] = useState({ type: '', text: '' });

    // ===========================================================================
    // DATA FETCHING
    // ===========================================================================

    /**
     * Fetch error logs from the API
     * 
     * Uses useCallback to ensure stable function reference,
     * allowing it to be used as a useEffect dependency.
     */
    const loadLogs = useCallback(async () => {
        try {
            // Build URL with filter parameter if set
            const url = filter
                ? `/api/admin/errors?level=${filter}`
                : '/api/admin/errors';

            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                setLogs(data.logs || []);
                setSummary(data.summary || { total: 0, error: 0, warn: 0, info: 0 });
            } else {
                console.error('Failed to load logs:', response.status);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    /**
     * Load logs on mount and when filter changes
     */
    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    // ===========================================================================
    // ACTIONS
    // ===========================================================================

    /**
     * Clear all error logs
     * 
     * This action cannot be undone!
     * Logs are stored in memory and will be gone forever.
     */
    async function handleClearLogs() {
        // Confirm before clearing
        if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/errors', { method: 'DELETE' });

            if (response.ok) {
                setLogs([]);
                setSummary({ total: 0, error: 0, warn: 0, info: 0 });
                setMessage({ type: 'success', text: 'All logs cleared! 🧹' });
            } else {
                throw new Error('Failed to clear logs');
            }
        } catch (error) {
            console.error('Failed to clear logs:', error);
            setMessage({ type: 'error', text: 'Failed to clear logs. Please try again.' });
        }
    }

    /**
     * Refresh logs from server
     */
    async function handleRefresh() {
        setIsLoading(true);
        await loadLogs();
        setMessage({ type: 'success', text: 'Logs refreshed! 🔄' });

        // Clear message after 2 seconds
        setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }

    // ===========================================================================
    // RENDER HELPERS
    // ===========================================================================

    /**
     * Get color style for log level badge
     */
    function getLevelColor(level) {
        switch (level) {
            case 'error':
                return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
            case 'warn':
                return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' };
            case 'info':
                return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
            default:
                return { background: 'rgba(156, 163, 175, 0.2)', color: '#9ca3af' };
        }
    }

    /**
     * Format timestamp for display
     */
    function formatTimestamp(isoString) {
        try {
            const date = new Date(isoString);
            return date.toLocaleString();
        } catch {
            return isoString;
        }
    }

    // ===========================================================================
    // LOADING STATE
    // ===========================================================================

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    // ===========================================================================
    // RENDER
    // ===========================================================================

    return (
        <div>
            {/* Page Header */}
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>📋 Error Logs</h1>
                <p className={styles.pageDescription}>
                    Monitor system errors and warnings. Logs are kept in memory and reset on server restart.
                </p>
            </header>

            {/* Feedback Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* Summary Cards */}
            <div className={styles.cardsGrid} style={{ marginBottom: 'var(--space-xl)' }}>
                <div
                    className={styles.statCard}
                    style={{ cursor: 'pointer', opacity: filter === null ? 1 : 0.6 }}
                    onClick={() => setFilter(null)}
                >
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statInfo}>
                        <h3>{summary.total}</h3>
                        <p>Total Logs</p>
                    </div>
                </div>

                <div
                    className={styles.statCard}
                    style={{ cursor: 'pointer', opacity: filter === 'error' ? 1 : 0.6 }}
                    onClick={() => setFilter('error')}
                >
                    <div className={styles.statIcon}>❌</div>
                    <div className={styles.statInfo}>
                        <h3 style={{ color: '#ef4444' }}>{summary.error}</h3>
                        <p>Errors</p>
                    </div>
                </div>

                <div
                    className={styles.statCard}
                    style={{ cursor: 'pointer', opacity: filter === 'warn' ? 1 : 0.6 }}
                    onClick={() => setFilter('warn')}
                >
                    <div className={styles.statIcon}>⚠️</div>
                    <div className={styles.statInfo}>
                        <h3 style={{ color: '#f59e0b' }}>{summary.warn}</h3>
                        <p>Warnings</p>
                    </div>
                </div>

                <div
                    className={styles.statCard}
                    style={{ cursor: 'pointer', opacity: filter === 'info' ? 1 : 0.6 }}
                    onClick={() => setFilter('info')}
                >
                    <div className={styles.statIcon}>ℹ️</div>
                    <div className={styles.statInfo}>
                        <h3 style={{ color: '#3b82f6' }}>{summary.info}</h3>
                        <p>Info</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
                <button className={styles.saveBtn} onClick={handleRefresh}>
                    🔄 Refresh
                </button>
                <button
                    className={styles.deleteBtn}
                    onClick={handleClearLogs}
                    disabled={logs.length === 0}
                >
                    🗑️ Clear All Logs
                </button>
            </div>

            {/* Logs List */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>
                    Recent Logs {filter && `(${filter} only)`}
                </h2>

                {logs.length === 0 ? (
                    <div style={{
                        padding: 'var(--space-xl)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p>🎉 No logs to display! Everything is running smoothly.</p>
                    </div>
                ) : (
                    <div className={styles.itemsList}>
                        {logs.map((log) => (
                            <div key={log.id} className={styles.itemCard}>
                                <div className={styles.itemInfo} style={{ width: '100%' }}>
                                    {/* Header Row */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-sm)',
                                        marginBottom: 'var(--space-xs)'
                                    }}>
                                        {/* Level Badge */}
                                        <span style={{
                                            ...getLevelColor(log.level),
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>
                                            {log.level}
                                        </span>

                                        {/* Timestamp */}
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <p style={{
                                        fontWeight: '500',
                                        marginBottom: 'var(--space-xs)'
                                    }}>
                                        {log.message}
                                    </p>

                                    {/* Context (if any) */}
                                    {log.context && Object.keys(log.context).length > 0 && (
                                        <pre style={{
                                            background: 'var(--bg-glass)',
                                            padding: 'var(--space-sm)',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            overflow: 'auto',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {JSON.stringify(log.context, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Help Text */}
            <section style={{
                marginTop: 'var(--space-xl)',
                padding: 'var(--space-lg)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)'
            }}>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>💡 About Error Logs</h3>
                <ul style={{
                    color: 'var(--text-secondary)',
                    paddingLeft: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-xs)'
                }}>
                    <li>Logs are stored in memory and will reset when the server restarts</li>
                    <li>Only the most recent 100 logs are kept to prevent memory issues</li>
                    <li>Sensitive data (API keys, passwords) are automatically redacted</li>
                    <li>Click on the summary cards to filter by log level</li>
                </ul>
            </section>
        </div>
    );
}
