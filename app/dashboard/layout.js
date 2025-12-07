/**
 * Dashboard Layout
 * 
 * Wraps all dashboard pages with:
 * - Authentication check
 * - Sidebar navigation
 * - Consistent styling
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';

// Navigation items for the sidebar
const navItems = [
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/dashboard/profile', label: 'Profile', icon: '👤' },
    { path: '/dashboard/experience', label: 'Experience', icon: '💼' },
    { path: '/dashboard/education', label: 'Education', icon: '🎓' },
    { path: '/dashboard/projects', label: 'Projects', icon: '🚀' },
    { path: '/dashboard/skills', label: 'Skills', icon: '⚡' },
    { path: '/dashboard/bot', label: 'Bot Settings', icon: '🤖' },
    { path: '/dashboard/integrations', label: 'Integrations', icon: '🔗' },
    { path: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { path: '/dashboard/errors', label: 'Error Logs', icon: '📋' },
];

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();

            if (data.authenticated) {
                setIsAuthenticated(true);
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/login');
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    async function handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.spinner}></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect to login
    }

    return (
        <div className={styles.dashboardWrapper}>
            {/* Mobile Menu Button */}
            <button
                className={styles.mobileMenuBtn}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? '✕' : '☰'}
            </button>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <h2 className={styles.logo}>Responsive CV/Resume</h2>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <a href="/" className={styles.viewSiteBtn} target="_blank">
                        👁️ View Public Site
                    </a>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        🚪 Logout
                    </button>
                    <div style={{ marginTop: '20px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: '1.4' }}>
                        BUILT BY @DicksonOtieno<br />using ANTIGRAVITY
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {children}
            </main>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
