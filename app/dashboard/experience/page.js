/**
 * Dashboard Experience Page
 * 
 * Manage work experience entries.
 */

'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

export default function ExperiencePage() {
    const [experiences, setExperiences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        company: '',
        role: '',
        period: '',
        location: '',
        description: '',
        highlights: []
    });
    const [newHighlight, setNewHighlight] = useState('');

    useEffect(() => {
        loadExperiences();
    }, []);

    async function loadExperiences() {
        try {
            const response = await fetch('/api/admin/profile');
            if (response.ok) {
                const data = await response.json();
                setExperiences(data.experience || []);
            }
        } catch (error) {
            console.error('Failed to load experiences:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setIsLoading(false);
        }
    }

    async function saveExperiences(newExperiences) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ experience: newExperiences })
            });

            if (response.ok) {
                setExperiences(newExperiences);
                setMessage({ type: 'success', text: 'Saved successfully! 🎉' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

    function startEditing(exp = null) {
        if (exp) {
            setEditingId(exp.id);
            setEditForm({
                company: exp.company || '',
                role: exp.role || '',
                period: exp.period || '',
                location: exp.location || '',
                description: exp.description || '',
                highlights: exp.highlights || []
            });
        } else {
            setEditingId('new');
            setEditForm({
                company: '',
                role: '',
                period: '',
                location: '',
                description: '',
                highlights: []
            });
        }
        setNewHighlight('');
    }

    function cancelEditing() {
        setEditingId(null);
        setEditForm({
            company: '',
            role: '',
            period: '',
            location: '',
            description: '',
            highlights: []
        });
    }

    function saveItem() {
        if (!editForm.company || !editForm.role) {
            setMessage({ type: 'error', text: 'Company and role are required' });
            return;
        }

        let newExperiences;
        if (editingId === 'new') {
            const newItem = {
                id: `exp-${Date.now()}`,
                ...editForm
            };
            newExperiences = [...experiences, newItem];
        } else {
            newExperiences = experiences.map(exp =>
                exp.id === editingId ? { ...exp, ...editForm } : exp
            );
        }

        saveExperiences(newExperiences);
        cancelEditing();
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this experience?')) {
            const newExperiences = experiences.filter(exp => exp.id !== id);
            saveExperiences(newExperiences);
        }
    }

    function addHighlight() {
        if (newHighlight.trim()) {
            setEditForm(prev => ({
                ...prev,
                highlights: [...prev.highlights, newHighlight.trim()]
            }));
            setNewHighlight('');
        }
    }

    function removeHighlight(index) {
        setEditForm(prev => ({
            ...prev,
            highlights: prev.highlights.filter((_, i) => i !== index)
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
                <h1 className={styles.pageTitle}>💼 Work Experience</h1>
                <p className={styles.pageDescription}>
                    Manage your professional experience
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
                        {editingId === 'new' ? '➕ Add Experience' : '✏️ Edit Experience'}
                    </h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Company *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Company Name"
                                value={editForm.company}
                                onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Role *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Software Engineer"
                                value={editForm.role}
                                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Period</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="2022 - Present"
                                value={editForm.period}
                                onChange={(e) => setEditForm(prev => ({ ...prev, period: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Location</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="Remote / City, Country"
                                value={editForm.location}
                                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                placeholder="What did you do in this role?"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Key Achievements</label>
                            <div className={styles.itemsList}>
                                {editForm.highlights.map((highlight, index) => (
                                    <div key={index} className={styles.itemCard}>
                                        <div className={styles.itemInfo}>
                                            <p>{highlight}</p>
                                        </div>
                                        <button
                                            className={styles.deleteBtn}
                                            onClick={() => removeHighlight(index)}
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
                                        value={newHighlight}
                                        onChange={(e) => setNewHighlight(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addHighlight();
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <button className={styles.saveBtn} onClick={addHighlight}>
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

            {/* Experiences List */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>📋 Your Experience ({experiences.length})</h2>
                <div className={styles.itemsList}>
                    {experiences.map((exp) => (
                        <div key={exp.id} className={styles.itemCard}>
                            <div className={styles.itemInfo}>
                                <h4>{exp.role} @ {exp.company}</h4>
                                <p>{exp.period} • {exp.location || 'Location not specified'}</p>
                                {exp.description && (
                                    <p style={{ marginTop: 'var(--space-sm)', color: 'var(--text-secondary)' }}>
                                        {exp.description.substring(0, 150)}...
                                    </p>
                                )}
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => startEditing(exp)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => deleteItem(exp.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {!editingId && (
                        <button className={styles.addBtn} onClick={() => startEditing()}>
                            ➕ Add Experience
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
