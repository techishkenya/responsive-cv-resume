/**
 * =============================================================================
 * THEME SWITCHER COMPONENT
 * =============================================================================
 * 
 * A fun settings panel for visitors to customize the visual experience.
 * 
 * Themes:
 * - Default: Purple/cyan gradient (current)
 * - Matrix: Green falling code effect
 * - Fun: Bright, colorful, playful
 * - Professional: Clean, minimal, serious
 * - Doodle: Hand-drawn, sketchy style
 * - Retro: 80s neon vibes
 * 
 * =============================================================================
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './ThemeSwitcher.module.css';

// Available themes
const THEMES = [
    { id: 'default', name: 'Default', icon: '🌌', description: 'Purple space vibes' },
    { id: 'matrix', name: 'Matrix', icon: '💚', description: 'Enter the matrix' },
    { id: 'fun', name: 'Fun', icon: '🎉', description: 'Bright & playful' },
    { id: 'professional', name: 'Pro', icon: '💼', description: 'Clean & minimal' },
    { id: 'doodle', name: 'Doodle', icon: '✏️', description: 'Hand-drawn style' },
    { id: 'retro', name: 'Retro', icon: '🕹️', description: '80s neon vibes' },
];

// Helper function to get random katakana character
function getRandomChar() {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    return chars[Math.floor(Math.random() * chars.length)];
}

// Helper to apply theme to document
function applyThemeToDocument(themeId) {
    if (typeof document === 'undefined') return;

    // Remove all theme classes
    THEMES.forEach(t => {
        document.documentElement.classList.remove(`theme-${t.id}`);
    });

    // Add new theme class
    document.documentElement.classList.add(`theme-${themeId}`);

    // Save preference
    try {
        localStorage.setItem('cv-theme', themeId);
    } catch (e) {
        // localStorage not available
    }
}

// Helper to generate matrix characters
function createMatrixChars() {
    if (typeof window === 'undefined') return [];

    const chars = [];
    const columns = Math.floor(window.innerWidth / 20);

    for (let i = 0; i < columns; i++) {
        chars.push({
            id: i,
            char: getRandomChar(),
            left: i * 20,
            delay: Math.random() * 5,
            duration: 3 + Math.random() * 5
        });
    }
    return chars;
}

export default function ThemeSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState('default');
    const [matrixChars, setMatrixChars] = useState([]);
    const [mounted, setMounted] = useState(false);
    const initRef = useRef(false);

    // Load saved theme on mount (client-side only)
    useEffect(() => {
        // Prevent double execution
        if (initRef.current) return;
        initRef.current = true;

        // Defer state updates to avoid cascading renders warning
        requestAnimationFrame(() => {
            setMounted(true);

            try {
                const saved = localStorage.getItem('cv-theme');
                if (saved && THEMES.find(t => t.id === saved)) {
                    setCurrentTheme(saved);
                    applyThemeToDocument(saved);
                    if (saved === 'matrix') {
                        setMatrixChars(createMatrixChars());
                    }
                }
            } catch (e) {
                // localStorage not available
            }
        });
    }, []);

    // Handle theme change
    const handleThemeChange = useCallback((themeId) => {
        setCurrentTheme(themeId);
        applyThemeToDocument(themeId);

        // Generate matrix characters if matrix theme
        if (themeId === 'matrix') {
            setMatrixChars(createMatrixChars());
        } else {
            setMatrixChars([]);
        }
    }, []);

    // Don't render anything until mounted (prevents hydration mismatch)
    if (!mounted) {
        return null;
    }

    return (
        <>
            {/* Matrix Rain Effect */}
            {currentTheme === 'matrix' && matrixChars.length > 0 && (
                <div className={styles.matrixRain}>
                    {matrixChars.map(char => (
                        <span
                            key={char.id}
                            className={styles.matrixChar}
                            style={{
                                left: `${char.left}px`,
                                animationDelay: `${char.delay}s`,
                                animationDuration: `${char.duration}s`
                            }}
                        >
                            {char.char}
                        </span>
                    ))}
                </div>
            )}

            {/* Settings Button */}
            <button
                className={styles.settingsBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Theme settings"
                title="Change theme"
            >
                ⚙️
            </button>

            {/* Theme Panel */}
            {isOpen && (
                <>
                    <div className={styles.overlay} onClick={() => setIsOpen(false)} />
                    <div className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <h3>🎨 Theme</h3>
                            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <div className={styles.themeGrid}>
                            {THEMES.map(theme => (
                                <button
                                    key={theme.id}
                                    className={`${styles.themeOption} ${currentTheme === theme.id ? styles.active : ''}`}
                                    onClick={() => handleThemeChange(theme.id)}
                                >
                                    <span className={styles.themeIcon}>{theme.icon}</span>
                                    <span className={styles.themeName}>{theme.name}</span>
                                    <span className={styles.themeDesc}>{theme.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
