/**
 * Dashboard Bot Settings Page
 * 
 * Configure the AI chatbot's personality, greeting, and rules.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

export default function BotSettingsPage() {
    const [config, setConfig] = useState({
        personality: {
            name: '',
            tone: '',
            greeting: '',
            fallbackMessage: ''
        },
        systemPrompt: '',
        quickReplies: [],
        allowedTopics: [],
        blockedTopics: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newQuickReply, setNewQuickReply] = useState('');
    const [newBlockedTopic, setNewBlockedTopic] = useState('');

    const loadConfig = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/bot-config');
            if (response.ok) {
                const data = await response.json();
                setConfig(prev => ({
                    ...prev,
                    ...data,
                    personality: { ...prev.personality, ...data.personality }
                }));
            }
        } catch (error) {
            console.error('Failed to load config:', error);
            setMessage({ type: 'error', text: 'Failed to load bot configuration' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    async function handleSave() {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/bot-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Bot settings saved! 🤖' });
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

    function updatePersonality(field, value) {
        setConfig(prev => ({
            ...prev,
            personality: { ...prev.personality, [field]: value }
        }));
    }

    function addQuickReply() {
        if (newQuickReply.trim()) {
            setConfig(prev => ({
                ...prev,
                quickReplies: [...(prev.quickReplies || []), newQuickReply.trim()]
            }));
            setNewQuickReply('');
        }
    }

    function removeQuickReply(index) {
        setConfig(prev => ({
            ...prev,
            quickReplies: prev.quickReplies.filter((_, i) => i !== index)
        }));
    }

    function addBlockedTopic() {
        if (newBlockedTopic.trim()) {
            setConfig(prev => ({
                ...prev,
                blockedTopics: [...(prev.blockedTopics || []), newBlockedTopic.trim()]
            }));
            setNewBlockedTopic('');
        }
    }

    function removeBlockedTopic(index) {
        setConfig(prev => ({
            ...prev,
            blockedTopics: prev.blockedTopics.filter((_, i) => i !== index)
        }));
    }

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
                <h1 className={styles.pageTitle}>🤖 Bot Settings</h1>
                <p className={styles.pageDescription}>
                    Customize how your AI assistant behaves and responds
                </p>
            </header>

            {/* Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* Personality */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>✨ Personality</h2>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Bot Name</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Dickson's Assistant"
                            value={config.personality?.name || ''}
                            onChange={(e) => updatePersonality('name', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tone</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="cheerful, funny, and professional"
                            value={config.personality?.tone || ''}
                            onChange={(e) => updatePersonality('tone', e.target.value)}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.formLabel}>Greeting Message</label>
                        <textarea
                            className={`${styles.formInput} ${styles.formTextarea}`}
                            placeholder="Hey there! 👋 I'm here to answer questions about..."
                            value={config.personality?.greeting || ''}
                            onChange={(e) => updatePersonality('greeting', e.target.value)}
                            rows={3}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            This is the first message visitors see when they open the chat
                        </span>
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.formLabel}>Fallback Message</label>
                        <textarea
                            className={`${styles.formInput} ${styles.formTextarea}`}
                            placeholder="Hmm, that's outside my expertise! Try asking about..."
                            value={config.personality?.fallbackMessage || ''}
                            onChange={(e) => updatePersonality('fallbackMessage', e.target.value)}
                            rows={2}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Shown when someone asks about off-topic subjects
                        </span>
                    </div>
                </div>
            </section>

            {/* System Prompt */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🧠 System Prompt</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Advanced: Customize the instructions given to the AI
                </p>
                <div className={styles.formGroup}>
                    <textarea
                        className={`${styles.formInput} ${styles.formTextarea}`}
                        placeholder="You are a cheerful, funny, and professional AI assistant representing..."
                        value={config.systemPrompt || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        rows={6}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                    />
                </div>
            </section>

            {/* Quick Replies */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>💬 Quick Replies</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Suggested questions shown to visitors
                </p>
                <div className={styles.itemsList}>
                    {config.quickReplies?.map((reply, index) => (
                        <div key={index} className={styles.itemCard}>
                            <div className={styles.itemInfo}>
                                <p>{reply}</p>
                            </div>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => removeQuickReply(index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Add a suggested question..."
                            value={newQuickReply}
                            onChange={(e) => setNewQuickReply(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addQuickReply();
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <button className={styles.saveBtn} onClick={addQuickReply}>
                            Add
                        </button>
                    </div>
                </div>
            </section>

            {/* Blocked Topics */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🚫 Blocked Topics</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Topics the bot will politely decline to discuss
                </p>
                <div className={styles.tagsContainer}>
                    {config.blockedTopics?.map((topic, index) => (
                        <span key={index} className={styles.tag} style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
                            {topic}
                            <button
                                className={styles.tagRemove}
                                onClick={() => removeBlockedTopic(index)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        className={styles.tagInput}
                        placeholder="Add blocked topic..."
                        value={newBlockedTopic}
                        onChange={(e) => setNewBlockedTopic(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addBlockedTopic();
                            }
                        }}
                    />
                </div>
            </section>

            {/* Save Button */}
            <div className={styles.formActions} style={{ background: 'transparent', border: 'none' }}>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : '💾 Save Bot Settings'}
                </button>
            </div>
        </div>
    );
}
