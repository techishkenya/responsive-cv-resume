/**
 * Dashboard Skills Page
 * 
 * Manage skills with proficiency levels.
 */

'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

const SKILL_CATEGORIES = [
    'Languages',
    'Frontend',
    'Backend',
    'Database',
    'Cloud',
    'DevOps',
    'Tools',
    'Other'
];

export default function SkillsPage() {
    const [skills, setSkills] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        level: 80,
        category: 'Other'
    });

    useEffect(() => {
        loadSkills();
    }, []);

    async function loadSkills() {
        try {
            const response = await fetch('/api/admin/profile', { cache: 'no-store' });
            if (response.ok) {
                const data = await response.json();
                setSkills(data.skills || []);
            }
        } catch (error) {
            console.error('Failed to load skills:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setIsLoading(false);
        }
    }

    async function saveSkills(newSkills) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skills: newSkills })
            });

            if (response.ok) {
                setSkills(newSkills);
                setMessage({ type: 'success', text: 'Saved successfully! 🎉' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

    function startEditing(skill = null, index = null) {
        if (skill) {
            setEditingId(index);
            setEditForm({
                name: skill.name || '',
                level: skill.level || 80,
                category: skill.category || 'Other'
            });
        } else {
            setEditingId('new');
            setEditForm({
                name: '',
                level: 80,
                category: 'Other'
            });
        }
    }

    function cancelEditing() {
        setEditingId(null);
    }

    function saveItem() {
        if (!editForm.name) {
            setMessage({ type: 'error', text: 'Skill name is required' });
            return;
        }

        let newSkills;
        if (editingId === 'new') {
            newSkills = [...skills, editForm];
        } else {
            newSkills = skills.map((skill, i) =>
                i === editingId ? editForm : skill
            );
        }

        saveSkills(newSkills);
        cancelEditing();
    }

    function deleteItem(index) {
        if (window.confirm('Are you sure you want to delete this skill?')) {
            const newSkills = skills.filter((_, i) => i !== index);
            saveSkills(newSkills);
        }
    }

    // Group skills by category
    const groupedSkills = skills.reduce((acc, skill, index) => {
        const category = skill.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push({ ...skill, originalIndex: index });
        return acc;
    }, {});

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
                <h1 className={styles.pageTitle}>⚡ Skills</h1>
                <p className={styles.pageDescription}>
                    Showcase your technical abilities
                </p>
            </header>

            {/* Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* Edit Form */}
            {editingId !== null && (
                <section className={styles.formSection}>
                    <h2 className={styles.formTitle}>
                        {editingId === 'new' ? '➕ Add Skill' : '✏️ Edit Skill'}
                    </h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Skill Name *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="JavaScript"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Category</label>
                            <select
                                className={styles.formInput}
                                value={editForm.category}
                                onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {SKILL_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>
                                Proficiency Level: {editForm.level}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={editForm.level}
                                onChange={(e) => setEditForm(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>Beginner</span>
                                <span>Intermediate</span>
                                <span>Expert</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.formActions}>
                        <button
                            className={styles.saveBtn}
                            onClick={saveItem}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : '💾 Save'}
                        </button>
                        <button className={styles.cancelBtn} onClick={cancelEditing}>
                            Cancel
                        </button>
                    </div>
                </section>
            )}

            {/* Skills by Category */}
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                <section key={category} className={styles.formSection}>
                    <h2 className={styles.formTitle}>{category} ({categorySkills.length})</h2>
                    <div className={styles.itemsList}>
                        {categorySkills.map((skill) => (
                            <div key={skill.originalIndex} className={styles.itemCard}>
                                <div className={styles.itemInfo} style={{ flex: 1 }}>
                                    <h4>{skill.name}</h4>
                                    <div style={{
                                        background: 'var(--bg-glass)',
                                        borderRadius: 'var(--radius-full)',
                                        height: '8px',
                                        marginTop: 'var(--space-sm)',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${skill.level}%`,
                                            height: '100%',
                                            background: 'linear-gradient(135deg, var(--primary-start), var(--primary-end))',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', marginTop: 'var(--space-xs)' }}>
                                        {skill.level}% proficiency
                                    </p>
                                </div>
                                <div className={styles.itemActions}>
                                    <button
                                        type="button"
                                        className={styles.editBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            startEditing(skill, skill.originalIndex);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.deleteBtn}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteItem(skill.originalIndex);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {/* Add Button */}
            {editingId === null && (
                <section className={styles.formSection}>
                    <button className={styles.addBtn} onClick={() => startEditing()}>
                        ➕ Add Skill
                    </button>
                </section>
            )}
        </div>
    );
}
