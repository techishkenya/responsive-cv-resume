/**
 * Login Page
 * 
 * Simple password authentication for the dashboard.
 * The password is stored as an environment variable.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                router.push('/dashboard');
            } else {
                setError(data.error || 'Invalid password');
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className={styles.main}>
            {/* Decorative orbs */}
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />

            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>🔐 Dashboard Login</h1>
                        <p className={styles.subtitle}>Enter your password to access the dashboard</p>
                    </div>

                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                placeholder="Enter dashboard password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.button}
                            disabled={isLoading || !password}
                        >
                            {isLoading ? (
                                <>
                                    <span className={styles.spinner} />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    <div className={styles.footer}>
                        <Link href="/" className={styles.backLink}>
                            ← Back to public site
                        </Link>
                    </div>
                </div>

                <p className={styles.hint}>
                    💡 Set <code>DASHBOARD_PASSWORD</code> in your environment variables
                </p>
                <div style={{ marginTop: '20px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                    BUILT BY @DicksonOtieno using ANTIGRAVITY
                </div>
            </div>
        </main>
    );
}
