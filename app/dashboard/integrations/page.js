/**
 * =============================================================================
 * DASHBOARD INTEGRATIONS PAGE
 * =============================================================================
 * 
 * Configure integrations that the chatbot can talk about:
 * - Favorite Playlists (manually entered - no API needed)
 * - Latest Tweet/Quote (manually entered - no API needed)
 * - Blog/RSS Feed (auto-fetched from your RSS feed)
 * 
 * All data is fed to the AI so it can answer questions about your
 * music taste, latest thoughts, and articles.
 * 
 * =============================================================================
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

export default function IntegrationsPage() {
    // ===========================================================================
    // STATE
    // ===========================================================================

    const [config, setConfig] = useState({
        integrations: {
            playlists: { enabled: false, items: [] },
            twitter: { enabled: false, username: '', latestTweet: '', tweetDate: '' },
            blog: { enabled: false, rssUrl: '', blogName: '' }
        }
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form states for adding new items
    const [newPlaylist, setNewPlaylist] = useState({ name: '', platform: 'Spotify', url: '' });

    // ===========================================================================
    // DATA LOADING
    // ===========================================================================

    const loadConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/bot-config');
            if (response.ok) {
                const data = await response.json();
                setConfig(prev => ({
                    ...prev,
                    integrations: {
                        playlists: { enabled: false, items: [], ...data.integrations?.playlists },
                        twitter: { enabled: false, username: '', latestTweet: '', tweetDate: '', ...data.integrations?.twitter },
                        blog: { enabled: false, rssUrl: '', blogName: '', ...data.integrations?.blog }
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to load config:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // ===========================================================================
    // SAVE HANDLER
    // ===========================================================================

    async function handleSave() {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/bot-config', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrations: config.integrations })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Integrations saved! The chatbot can now talk about these. 🎉' });
            } else if (response.status === 403) {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save:', error);
            setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    }

    // ===========================================================================
    // PLAYLIST HANDLERS
    // ===========================================================================

    function addPlaylist() {
        if (!newPlaylist.name || !newPlaylist.url) return;

        setConfig(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                playlists: {
                    ...prev.integrations.playlists,
                    items: [...(prev.integrations.playlists.items || []), { ...newPlaylist }]
                }
            }
        }));

        setNewPlaylist({ name: '', platform: 'Spotify', url: '' });
    }

    function removePlaylist(index) {
        setConfig(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                playlists: {
                    ...prev.integrations.playlists,
                    items: prev.integrations.playlists.items.filter((_, i) => i !== index)
                }
            }
        }));
    }

    // ===========================================================================
    // UPDATE HANDLERS
    // ===========================================================================

    function updateTwitter(field, value) {
        setConfig(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                twitter: { ...prev.integrations.twitter, [field]: value }
            }
        }));
    }

    function updateBlog(field, value) {
        setConfig(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                blog: { ...prev.integrations.blog, [field]: value }
            }
        }));
    }

    function toggleIntegration(type, enabled) {
        setConfig(prev => ({
            ...prev,
            integrations: {
                ...prev.integrations,
                [type]: { ...prev.integrations[type], enabled }
            }
        }));
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
                <h1 className={styles.pageTitle}>🔗 Integrations</h1>
                <p className={styles.pageDescription}>
                    Add content the chatbot can share with visitors. No API keys needed!
                </p>
            </header>

            {/* Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* ================================================================== */}
            {/* FAVORITE PLAYLISTS */}
            {/* ================================================================== */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🎵 Favorite Playlists</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Share your music taste! Add links to your favorite playlists.
                </p>

                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.integrations?.playlists?.enabled || false}
                            onChange={(e) => toggleIntegration('playlists', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span className={styles.formLabel} style={{ marginBottom: 0 }}>
                            Enable Playlists (visitors can ask about my music)
                        </span>
                    </label>
                </div>

                {config.integrations?.playlists?.enabled && (
                    <>
                        {/* Existing Playlists */}
                        {config.integrations.playlists.items?.length > 0 && (
                            <div className={styles.itemsList} style={{ marginBottom: 'var(--space-lg)' }}>
                                {config.integrations.playlists.items.map((playlist, index) => (
                                    <div key={index} className={styles.itemCard}>
                                        <div className={styles.itemInfo}>
                                            <h3>{playlist.name}</h3>
                                            <p>{playlist.platform} • <a href={playlist.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>View Playlist</a></p>
                                        </div>
                                        <button className={styles.deleteBtn} onClick={() => removePlaylist(index)}>
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Playlist */}
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Playlist Name</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    placeholder="Chill Vibes"
                                    value={newPlaylist.name}
                                    onChange={(e) => setNewPlaylist(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Platform</label>
                                <select
                                    className={styles.formInput}
                                    value={newPlaylist.platform}
                                    onChange={(e) => setNewPlaylist(prev => ({ ...prev, platform: e.target.value }))}
                                >
                                    <option value="Spotify">Spotify</option>
                                    <option value="Apple Music">Apple Music</option>
                                    <option value="YouTube Music">YouTube Music</option>
                                    <option value="SoundCloud">SoundCloud</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                <label className={styles.formLabel}>Playlist URL</label>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <input
                                        type="url"
                                        className={styles.formInput}
                                        placeholder="https://open.spotify.com/playlist/..."
                                        value={newPlaylist.url}
                                        onChange={(e) => setNewPlaylist(prev => ({ ...prev, url: e.target.value }))}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className={styles.saveBtn}
                                        onClick={addPlaylist}
                                        disabled={!newPlaylist.name || !newPlaylist.url}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!config.integrations?.playlists?.enabled && (
                    <div style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p>🎧 Enable to let visitors ask: What music do you listen to?</p>
                    </div>
                )}
            </section>

            {/* ================================================================== */}
            {/* LATEST TWEET/QUOTE */}
            {/* ================================================================== */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>💬 Latest Tweet / Quote</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Share your latest thought! Update this whenever you post something interesting.
                </p>

                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.integrations?.twitter?.enabled || false}
                            onChange={(e) => toggleIntegration('twitter', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span className={styles.formLabel} style={{ marginBottom: 0 }}>
                            Enable Latest Tweet (visitors can ask what I am thinking about)
                        </span>
                    </label>
                </div>

                {config.integrations?.twitter?.enabled && (
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Twitter/X Username (optional)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="@yourusername"
                                value={config.integrations?.twitter?.username || ''}
                                onChange={(e) => updateTwitter('username', e.target.value.replace('@', ''))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Date (optional)</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Dec 7, 2024"
                                value={config.integrations?.twitter?.tweetDate || ''}
                                onChange={(e) => updateTwitter('tweetDate', e.target.value)}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Your Latest Tweet / Quote</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                placeholder="Paste your latest tweet or a quote you want to share..."
                                value={config.integrations?.twitter?.latestTweet || ''}
                                onChange={(e) => updateTwitter('latestTweet', e.target.value)}
                                rows={3}
                            />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-xs)', display: 'block' }}>
                                💡 Update this whenever you post something you want visitors to know about
                            </span>
                        </div>
                    </div>
                )}

                {!config.integrations?.twitter?.enabled && (
                    <div style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p>📱 Enable to let visitors ask: What is your latest thought?</p>
                    </div>
                )}
            </section>

            {/* ================================================================== */}
            {/* BLOG / RSS FEED */}
            {/* ================================================================== */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>📝 Blog / Articles</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Link your blog RSS feed to automatically share recent articles.
                </p>

                <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.integrations?.blog?.enabled || false}
                            onChange={(e) => toggleIntegration('blog', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span className={styles.formLabel} style={{ marginBottom: 0 }}>
                            Enable Blog Feed (automatically fetches your latest articles)
                        </span>
                    </label>
                </div>

                {config.integrations?.blog?.enabled && (
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Blog Name</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="My Tech Blog"
                                value={config.integrations?.blog?.blogName || ''}
                                onChange={(e) => updateBlog('blogName', e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>RSS Feed URL</label>
                            <input
                                type="url"
                                className={styles.formInput}
                                placeholder="https://yourblog.com/feed.xml"
                                value={config.integrations?.blog?.rssUrl || ''}
                                onChange={(e) => updateBlog('rssUrl', e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {config.integrations?.blog?.enabled && (
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--space-md)'
                    }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            ℹ️ The chatbot will automatically fetch your latest 5 articles from this RSS feed. Most blog platforms (WordPress, Medium, Ghost, Dev.to) have RSS feeds built-in!
                        </p>
                    </div>
                )}

                {!config.integrations?.blog?.enabled && (
                    <div style={{
                        padding: 'var(--space-lg)',
                        background: 'var(--bg-glass)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p>✍️ Enable to let visitors ask: What have you written about recently?</p>
                    </div>
                )}
            </section>

            {/* ================================================================== */}
            {/* SAVE BUTTON */}
            {/* ================================================================== */}
            <div className={styles.formActions} style={{ background: 'transparent', border: 'none' }}>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : '💾 Save Integrations'}
                </button>
            </div>

            {/* Help Section */}
            <section style={{
                marginTop: 'var(--space-xl)',
                padding: 'var(--space-lg)',
                background: 'var(--bg-glass)',
                borderRadius: 'var(--radius-md)'
            }}>
                <h3 style={{ marginBottom: 'var(--space-sm)' }}>💡 How This Works</h3>
                <ul style={{
                    color: 'var(--text-secondary)',
                    paddingLeft: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-xs)'
                }}>
                    <li>When enabled, visitors can ask the chatbot about these topics</li>
                    <li>Playlists and quotes are shared as is - just update them anytime</li>
                    <li>Blog articles are fetched automatically from your RSS feed</li>
                    <li>No API keys or external accounts needed!</li>
                </ul>
            </section>
        </div>
    );
}
