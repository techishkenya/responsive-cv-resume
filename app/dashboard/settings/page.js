/**
 * =============================================================================
 * DASHBOARD SETTINGS PAGE
 * =============================================================================
 * 
 * Admin page for managing API keys and system settings.
 * 
 * Features:
 * - View API key status (masked)
 * - Enter/update Gemini API key
 * - Delete API key
 * 
 * Security:
 * - Only accessible to authenticated admins
 * - API key is never fully displayed
 * - Key is encrypted when stored
 * 
 * =============================================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

/**
 * Settings Page Component
 */
export default function SettingsPage() {
    // ===========================================================================
    // STATE
    // ===========================================================================

    /** API key status from server */
    const [keyStatus, setKeyStatus] = useState({
        configured: false,
        source: 'none',
        maskedKey: null,
        canEdit: true
    });

    /** New API key being entered */
    const [newApiKey, setNewApiKey] = useState('');

    /** UI states */
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ===========================================================================
    // DATA FETCHING
    // ===========================================================================

    /**
     * Load API key status from server
     */
    const loadKeyStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/api-key');
            if (response.ok) {
                const data = await response.json();
                setKeyStatus({
                    configured: data.configured,
                    source: data.source,
                    maskedKey: data.maskedKey,
                    canEdit: data.canEdit
                });
            }
        } catch (error) {
            console.error('Failed to load API key status:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Load on mount
     */
    useEffect(() => {
        loadKeyStatus();
    }, [loadKeyStatus]);

    // ===========================================================================
    // ACTIONS
    // ===========================================================================

    /**
     * Save new API key
     */
    async function handleSaveKey(e) {
        e.preventDefault();

        if (!newApiKey.trim()) {
            setMessage({ type: 'error', text: 'Please enter an API key' });
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: newApiKey.trim() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: 'success', text: data.message || 'API key saved!' });
                setNewApiKey(''); // Clear the input
                setKeyStatus({
                    configured: data.configured,
                    source: data.source,
                    maskedKey: data.maskedKey,
                    canEdit: data.canEdit
                });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save API key' });
            }
        } catch (error) {
            console.error('Failed to save API key:', error);
            setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    }

    /**
     * Delete API key
     */
    async function handleDeleteKey() {
        if (!confirm('Are you sure you want to remove the API key? The chatbot will stop working.')) {
            return;
        }

        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/api-key', {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setMessage({ type: 'success', text: 'API key removed' });
                setKeyStatus({
                    configured: false,
                    source: 'none',
                    maskedKey: null,
                    canEdit: true
                });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to remove API key' });
            }
        } catch (error) {
            console.error('Failed to delete API key:', error);
            setMessage({ type: 'error', text: 'Failed to remove API key' });
        } finally {
            setIsSaving(false);
        }
    }

    // ===========================================================================
    // RENDER
    // ===========================================================================

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>⚙️ Settings</h1>
                <p className={styles.pageDescription}>
                    Manage your API keys and system configuration
                </p>
            </header>

            {/* Feedback Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* API Key Section */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🔑 Gemini API Key</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-lg)' }}>
                    The API key powers the chatbot. Get a free key from{' '}
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--primary)' }}
                    >
                        Google AI Studio
                    </a>
                </p>

                {/* Current Status */}
                <div style={{
                    padding: 'var(--space-lg)',
                    background: keyStatus.configured
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                    border: `1px solid ${keyStatus.configured ? 'rgba(34, 197, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-lg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                            {keyStatus.configured ? '✅' : '⚠️'}
                        </span>
                        <strong>
                            {keyStatus.configured ? 'API Key Configured' : 'API Key Not Set'}
                        </strong>
                    </div>

                    {keyStatus.configured && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <p>
                                <strong>Source:</strong>{' '}
                                {keyStatus.source === 'environment'
                                    ? 'Environment Variable'
                                    : 'Dashboard Entry'}
                            </p>
                            <p>
                                <strong>Key:</strong>{' '}
                                <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {keyStatus.maskedKey}
                                </code>
                            </p>
                        </div>
                    )}

                    {!keyStatus.configured && (
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Enter your Gemini API key below to enable the chatbot.
                        </p>
                    )}
                </div>

                {/* Environment Variable Warning */}
                {keyStatus.source === 'environment' && (
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)'
                    }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            ℹ️ Your API key is set via environment variable (GEMINI_API_KEY).
                            To manage it here, remove the environment variable first.
                        </p>
                    </div>
                )}

                {/* API Key Form */}
                {keyStatus.canEdit && (
                    <form onSubmit={handleSaveKey}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>
                                {keyStatus.configured ? 'Update API Key' : 'Enter API Key'}
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <input
                                    type="password"
                                    className={styles.formInput}
                                    placeholder="AIza..."
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    disabled={isSaving}
                                    style={{ flex: 1 }}
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className={styles.saveBtn}
                                    disabled={isSaving || !newApiKey.trim()}
                                >
                                    {isSaving ? 'Saving...' : 'Save Key'}
                                </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)', display: 'block' }}>
                                Your API key is encrypted and stored securely. It is never exposed to visitors.
                            </span>
                        </div>
                    </form>
                )}

                {/* Delete Button */}
                {keyStatus.configured && keyStatus.canEdit && (
                    <button
                        className={styles.deleteBtn}
                        onClick={handleDeleteKey}
                        disabled={isSaving}
                        style={{ marginTop: 'var(--space-lg)' }}
                    >
                        🗑️ Remove API Key
                    </button>
                )}
            </section>

            {/* Security Info */}
            <section style={{
                marginTop: 'var(--space-xl)',
                padding: 'var(--space-lg)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)'
            }}>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>🔒 Security Information</h3>
                <ul style={{
                    color: 'var(--text-secondary)',
                    paddingLeft: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-xs)'
                }}>
                    <li>Your API key is encrypted using AES-256 before storage</li>
                    <li>The key is never sent to visitors or exposed in browser code</li>
                    <li>Only authenticated admins can view or change the key</li>
                    <li>You can also set the key via GEMINI_API_KEY environment variable</li>
                </ul>
            </section>
        </div>
    );
}
