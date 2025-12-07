/**
 * Dashboard Overview Page
 * 
 * Shows quick stats and recent activity.
 * This is the main landing page for the dashboard.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadProfile = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/profile');
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

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
                <h1 className={styles.pageTitle}>
                    Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}! 👋
                </h1>
                <p className={styles.pageDescription}>
                    Here is an overview of your interactive CV
                </p>
            </header>

            {/* Stats Grid */}
            <div className={styles.cardsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💼</div>
                    <div className={styles.statInfo}>
                        <h3>{profile?.experience?.length || 0}</h3>
                        <p>Work Experiences</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🎓</div>
                    <div className={styles.statInfo}>
                        <h3>{profile?.education?.length || 0}</h3>
                        <p>Education Entries</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🚀</div>
                    <div className={styles.statInfo}>
                        <h3>{profile?.projects?.length || 0}</h3>
                        <p>Projects</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⚡</div>
                    <div className={styles.statInfo}>
                        <h3>{profile?.skills?.length || 0}</h3>
                        <p>Skills Listed</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <section className={styles.formSection} style={{ marginTop: 'var(--space-xl)' }}>
                <h2 className={styles.formTitle}>🎯 Quick Actions</h2>
                <div className={styles.cardsGrid}>
                    <Link href="/dashboard/profile" className={styles.statCard} style={{ textDecoration: 'none' }}>
                        <div className={styles.statIcon}>👤</div>
                        <div className={styles.statInfo}>
                            <h3 style={{ fontSize: '1rem' }}>Update Profile</h3>
                            <p>Edit your name, bio, and social links</p>
                        </div>
                    </Link>

                    <Link href="/dashboard/bot" className={styles.statCard} style={{ textDecoration: 'none' }}>
                        <div className={styles.statIcon}>🤖</div>
                        <div className={styles.statInfo}>
                            <h3 style={{ fontSize: '1rem' }}>Bot Settings</h3>
                            <p>Customize your AI assistant</p>
                        </div>
                    </Link>

                    <a href="/" target="_blank" className={styles.statCard} style={{ textDecoration: 'none' }}>
                        <div className={styles.statIcon}>👁️</div>
                        <div className={styles.statInfo}>
                            <h3 style={{ fontSize: '1rem' }}>View Public Site</h3>
                            <p>See how visitors experience your CV</p>
                        </div>
                    </a>
                </div>
            </section>

            {/* Tips Section */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>💡 Tips</h2>
                <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                    <li>Add detailed descriptions to help the AI answer questions better</li>
                    <li>Include fun facts to make conversations more engaging</li>
                    <li>Keep your skills and projects up to date</li>
                    <li>Connect your Spotify to let visitors know what you are listening to</li>
                </ul>
            </section>
        </div>
    );
}
