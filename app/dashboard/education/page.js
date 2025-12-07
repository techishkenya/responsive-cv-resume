/**
 * Dashboard Education Page
 * 
 * Manage education entries.
 */

'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

export default function EducationPage() {
    const [education, setEducation] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        institution: '',
        degree: '',
        period: '',
        description: '',
        achievements: []
    });
    const [newAchievement, setNewAchievement] = useState('');

    useEffect(() => {
        loadEducation();
    }, []);

    async function loadEducation() {
        try {
            const response = await fetch('/api/admin/profile');
            if (response.ok) {
                const data = await response.json();
                setEducation(data.education || []);
            }
        } catch (error) {
            console.error('Failed to load education:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setIsLoading(false);
        }
    }

    async function saveEducation(newEducation) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ education: newEducation })
            });

            if (response.ok) {
                setEducation(newEducation);
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

    function startEditing(edu = null) {
        if (edu) {
            setEditingId(edu.id);
            setEditForm({
                institution: edu.institution || '',
                degree: edu.degree || '',
                period: edu.period || '',
                description: edu.description || '',
                achievements: edu.achievements || []
            });
        } else {
            setEditingId('new');
            setEditForm({
                institution: '',
                degree: '',
                period: '',
                description: '',
                achievements: []
            });
        }
        setNewAchievement('');
    }

    function cancelEditing() {
        setEditingId(null);
    }

    function saveItem() {
        if (!editForm.institution || !editForm.degree) {
            setMessage({ type: 'error', text: 'Institution and degree are required' });
            return;
        }

        let newEducation;
        if (editingId === 'new') {
            const newItem = {
                id: `edu-${Date.now()}`,
                ...editForm
            };
            newEducation = [...education, newItem];
        } else {
            newEducation = education.map(edu =>
                edu.id === editingId ? { ...edu, ...editForm } : edu
            );
        }

        saveEducation(newEducation);
        cancelEditing();
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const newEducation = education.filter(edu => edu.id !== id);
            saveEducation(newEducation);
        }
    }

    function addAchievement() {
        if (newAchievement.trim()) {
            setEditForm(prev => ({
                ...prev,
                achievements: [...prev.achievements, newAchievement.trim()]
            }));
            setNewAchievement('');
        }
    }

    function removeAchievement(index) {
        setEditForm(prev => ({
            ...prev,
            achievements: prev.achievements.filter((_, i) => i !== index)
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
                <h1 className={styles.pageTitle}>🎓 Education</h1>
                <p className={styles.pageDescription}>
                    Manage your educational background
                </p>
            </header>

            {/* Messages */}
            {message.text && (
                <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
                    {message.text}
                </div>
            )}

            {/* Edit Form */}
            {editingId && (
                <section className={styles.formSection}>
                    <h2 className={styles.formTitle}>
                        {editingId === 'new' ? '➕ Add Education' : '✏️ Edit Education'}
                    </h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Institution *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="University Name"
                                value={editForm.institution}
                                onChange={(e) => setEditForm(prev => ({ ...prev, institution: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Degree *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="BSc Computer Science"
                                value={editForm.degree}
                                onChange={(e) => setEditForm(prev => ({ ...prev, degree: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Period</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="2016 - 2020"
                                value={editForm.period}
                                onChange={(e) => setEditForm(prev => ({ ...prev, period: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                placeholder="What did you study? Any focus areas?"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Achievements</label>
                            <div className={styles.itemsList}>
                                {editForm.achievements.map((achievement, index) => (
                                    <div key={index} className={styles.itemCard}>
                                        <div className={styles.itemInfo}>
                                            <p>{achievement}</p>
                                        </div>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => removeAchievement(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <input
                                        type="text"
                                        className={styles.formInput}
                                        placeholder="Add an achievement..."
                                        value={newAchievement}
                                        onChange={(e) => setNewAchievement(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addAchievement();
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <button className={styles.saveBtn} onClick={addAchievement}>
                                        Add
                                    </button>
                                </div>
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

            {/* Education List */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>📋 Your Education ({education.length})</h2>
                <div className={styles.itemsList}>
                    {education.map((edu) => (
                        <div key={edu.id} className={styles.itemCard}>
                            <div className={styles.itemInfo}>
                                <h4>{edu.degree}</h4>
                                <p>{edu.institution} • {edu.period}</p>
                                {edu.description && (
                                    <p style={{ marginTop: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                                        {edu.description.substring(0, 100)}...
                                    </p>
                                )}
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => startEditing(edu)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => deleteItem(edu.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {!editingId && (
                        <button className={styles.addBtn} onClick={() => startEditing()}>
                            ➕ Add Education
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
