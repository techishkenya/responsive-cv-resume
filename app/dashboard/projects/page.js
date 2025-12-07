/**
 * Dashboard Projects Page
 * 
 * Manage project portfolio entries.
 */

'use client';

import { useState, useEffect } from 'react';
import styles from '../dashboard.module.css';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        technologies: [],
        link: '',
        featured: false
    });
    const [newTech, setNewTech] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const response = await fetch('/api/admin/profile');
            if (response.ok) {
                const data = await response.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setIsLoading(false);
        }
    }

    async function saveProjects(newProjects) {
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects: newProjects })
            });

            if (response.ok) {
                setProjects(newProjects);
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

    function startEditing(proj = null) {
        if (proj) {
            setEditingId(proj.id);
            setEditForm({
                name: proj.name || '',
                description: proj.description || '',
                technologies: proj.technologies || [],
                link: proj.link || '',
                featured: proj.featured || false
            });
        } else {
            setEditingId('new');
            setEditForm({
                name: '',
                description: '',
                technologies: [],
                link: '',
                featured: false
            });
        }
        setNewTech('');
    }

    function cancelEditing() {
        setEditingId(null);
    }

    function saveItem() {
        if (!editForm.name) {
            setMessage({ type: 'error', text: 'Project name is required' });
            return;
        }

        let newProjects;
        if (editingId === 'new') {
            const newItem = {
                id: `proj-${Date.now()}`,
                ...editForm
            };
            newProjects = [...projects, newItem];
        } else {
            newProjects = projects.map(proj =>
                proj.id === editingId ? { ...proj, ...editForm } : proj
            );
        }

        saveProjects(newProjects);
        cancelEditing();
    }

    function deleteItem(id) {
        if (confirm('Are you sure you want to delete this project?')) {
            const newProjects = projects.filter(proj => proj.id !== id);
            saveProjects(newProjects);
        }
    }

    function addTech() {
        if (newTech.trim()) {
            setEditForm(prev => ({
                ...prev,
                technologies: [...prev.technologies, newTech.trim()]
            }));
            setNewTech('');
        }
    }

    function removeTech(index) {
        setEditForm(prev => ({
            ...prev,
            technologies: prev.technologies.filter((_, i) => i !== index)
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
                <h1 className={styles.pageTitle}>🚀 Projects</h1>
                <p className={styles.pageDescription}>
                    Showcase your best work
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
                        {editingId === 'new' ? '➕ Add Project' : '✏️ Edit Project'}
                    </h2>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Project Name *</label>
                            <input
                                type="text"
                                className={styles.formInput}
                                placeholder="My Awesome Project"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Link (optional)</label>
                            <input
                                type="url"
                                className={styles.formInput}
                                placeholder="https://github.com/..."
                                value={editForm.link}
                                onChange={(e) => setEditForm(prev => ({ ...prev, link: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Description</label>
                            <textarea
                                className={`${styles.formInput} ${styles.formTextarea}`}
                                placeholder="What does this project do? What problems does it solve?"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                            <label className={styles.formLabel}>Technologies</label>
                            <div className={styles.tagsContainer}>
                                {editForm.technologies.map((tech, index) => (
                                    <span key={index} className={styles.tag}>
                                        {tech}
                                        <button
                                            className={styles.tagRemove}
                                            onClick={() => removeTech(index)}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    className={styles.tagInput}
                                    placeholder="Add technology..."
                                    value={newTech}
                                    onChange={(e) => setNewTech(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTech();
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={editForm.featured}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, featured: e.target.checked }))}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <span className={styles.formLabel} style={{ marginBottom: 0 }}>
                                    ⭐ Featured Project
                                </span>
                            </label>
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

            {/* Projects List */}
            <section className={styles.formSection}>
                <h2 className={styles.formTitle}>📋 Your Projects ({projects.length})</h2>
                <div className={styles.itemsList}>
                    {projects.map((proj) => (
                        <div key={proj.id} className={styles.itemCard}>
                            <div className={styles.itemInfo}>
                                <h4>
                                    {proj.featured && '⭐ '}
                                    {proj.name}
                                </h4>
                                <p>{proj.description?.substring(0, 100)}...</p>
                                {proj.technologies?.length > 0 && (
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', flexWrap: 'wrap' }}>
                                        {proj.technologies.slice(0, 5).map((tech, i) => (
                                            <span key={i} className={styles.tag} style={{ fontSize: '0.7rem' }}>
                                                {tech}
                                            </span>
                                        ))}
                                        {proj.technologies.length > 5 && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                +{proj.technologies.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className={styles.itemActions}>
                                <button
                                    className={styles.editBtn}
                                    onClick={() => startEditing(proj)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => deleteItem(proj.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {!editingId && (
                        <button className={styles.addBtn} onClick={() => startEditing()}>
                            ➕ Add Project
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}
