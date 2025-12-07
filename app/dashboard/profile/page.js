/**
 * Dashboard Profile Page
 * 
 * Edit basic profile information like name, bio, avatar, and social links.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '../dashboard.module.css';

export default function ProfilePage() {
    const [profile, setProfile] = useState({
        name: '',
        title: '',
        tagline: '',
        bio: '',
        location: '',
        email: '',
        avatar: '',
        social: {
            github: '',
            linkedin: '',
            twitter: '',
            spotify: ''
        },
        interests: [],
        funFacts: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newInterest, setNewInterest] = useState('');
    const [newFunFact, setNewFunFact] = useState('');

    const loadProfile = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/profile');
            if (response.ok) {
                const data = await response.json();
                setProfile(prev => ({
                    ...prev,
                    ...data,
                    social: { ...prev.social, ...data.social }
                }));
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    async function handleSave() {
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile saved successfully! 🎉' });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    }

    function updateProfile(field, value) {
        setProfile(prev => ({ ...prev, [field]: value }));
    }

    function updateSocial(platform, value) {
        setProfile(prev => ({
            ...prev,
            social: { ...prev.social, [platform]: value }
        }));
    }

    function addInterest() {
        if (newInterest.trim()) {
            setProfile(prev => ({
                ...prev,
                interests: [...(prev.interests || []), newInterest.trim()]
            }));
            setNewInterest('');
        }
    }

    function removeInterest(index) {
        setProfile(prev => ({
            ...prev,
            interests: prev.interests.filter((_, i) => i !== index)
        }));
    }

    function addFunFact() {
        if (newFunFact.trim()) {
            setProfile(prev => ({
                ...prev,
                funFacts: [...(prev.funFacts || []), newFunFact.trim()]
            }));
            setNewFunFact('');
        }
    }

    function removeFunFact(index) {
        setProfile(prev => ({
            ...prev,
            funFacts: prev.funFacts.filter((_, i) => i !== index)
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
                <h1 className={styles.pageTitle}>👤 Profile</h1>
                <p className={styles.pageDescription}>
                    Update your basic information and social links
                </p>
            </header>

            {/* Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* Basic Info */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>📝 Basic Information</h2>

                {/* Avatar Preview */}
                <div className={styles.avatarPreview} style={{ marginBottom: 'var(--space-lg)' }}>
                    <img
                        src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=7c3aed&color=fff&size=100`}
                        alt="Avatar"
                        className={styles.avatarImage}
                        style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                            backgroundColor: 'var(--bg-secondary)'
                        }}
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=7c3aed&color=fff&size=100`;
                        }}
                    />
                    <div className={styles.avatarUpload}>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Avatar URL (or paste image URL)"
                            value={profile.avatar}
                            onChange={(e) => updateProfile('avatar', e.target.value)}
                            style={{ width: '300px' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Tip: Use a square image for best results
                        </span>
                    </div>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Full Name</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="John Doe"
                            value={profile.name}
                            onChange={(e) => updateProfile('name', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Professional Title</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Software Engineer"
                            value={profile.title}
                            onChange={(e) => updateProfile('title', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Tagline</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Building cool things with code ✨"
                            value={profile.tagline}
                            onChange={(e) => updateProfile('tagline', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Location</label>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Nairobi, Kenya"
                            value={profile.location}
                            onChange={(e) => updateProfile('location', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email</label>
                        <input
                            type="email"
                            className={styles.formInput}
                            placeholder="hello@example.com"
                            value={profile.email}
                            onChange={(e) => updateProfile('email', e.target.value)}
                        />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.formLabel}>Bio</label>
                        <textarea
                            className={`${styles.formInput} ${styles.formTextarea}`}
                            placeholder="Tell visitors about yourself..."
                            value={profile.bio}
                            onChange={(e) => updateProfile('bio', e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>
            </section>

            {/* Social Links */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🔗 Social Links</h2>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>GitHub</label>
                        <input
                            type="url"
                            className={styles.formInput}
                            placeholder="https://github.com/username"
                            value={profile.social?.github || ''}
                            onChange={(e) => updateSocial('github', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>LinkedIn</label>
                        <input
                            type="url"
                            className={styles.formInput}
                            placeholder="https://linkedin.com/in/username"
                            value={profile.social?.linkedin || ''}
                            onChange={(e) => updateSocial('linkedin', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Twitter/X</label>
                        <input
                            type="url"
                            className={styles.formInput}
                            placeholder="https://twitter.com/username"
                            value={profile.social?.twitter || ''}
                            onChange={(e) => updateSocial('twitter', e.target.value)}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Spotify Profile</label>
                        <input
                            type="url"
                            className={styles.formInput}
                            placeholder="https://open.spotify.com/user/username"
                            value={profile.social?.spotify || ''}
                            onChange={(e) => updateSocial('spotify', e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Interests */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🎯 Interests & Hobbies</h2>
                <div className={styles.tagsContainer}>
                    {profile.interests?.map((interest, index) => (
                        <span key={index} className={styles.tag}>
                            {interest}
                            <button
                                className={styles.tagRemove}
                                onClick={() => removeInterest(index)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        className={styles.tagInput}
                        placeholder="Add interest and press Enter..."
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                addInterest();
                            }
                        }}
                    />
                </div>
            </section>

            {/* Fun Facts */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>🎉 Fun Facts</h2>
                <p className={styles.pageDescription} style={{ marginBottom: 'var(--space-md)' }}>
                    Add interesting tidbits about yourself - these make conversations more engaging!
                </p>
                <div className={styles.itemsList}>
                    {profile.funFacts?.map((fact, index) => (
                        <div key={index} className={styles.itemCard}>
                            <div className={styles.itemInfo}>
                                <p>{fact}</p>
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => removeFunFact(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Add a fun fact about yourself..."
                            value={newFunFact}
                            onChange={(e) => setNewFunFact(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addFunFact();
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <button className={styles.saveBtn} onClick={addFunFact}>
                            Add
                        </button>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className={styles.formActions} style={{ background: 'transparent', border: 'none' }}>
                <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : '💾 Save Changes'}
                </button>
            </div>
        </div>
    );
}
