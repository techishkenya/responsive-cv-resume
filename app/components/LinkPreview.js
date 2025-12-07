
'use client';

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

const LinkPreview = ({ href, children }) => {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!href) return;

        // Flag to prevent state update on unmount
        let isMounted = true;

        const fetchPreview = async () => {
            try {
                const res = await fetch(`/api/preview?url=${encodeURIComponent(href)}`);
                const data = await res.json();

                if (isMounted && !data.error && (data.title || data.image)) {
                    setPreview(data);
                }
            } catch (e) {
                // Silent fail for previews
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPreview();

        return () => { isMounted = false; };
    }, [href]);

    return (
        <>
            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.mdLink}>
                {children}
            </a>
            {preview && (
                <a href={href} target="_blank" rel="noopener noreferrer" className={styles.linkPreview}>
                    {preview.image && (
                        <img src={preview.image} alt={preview.title || 'Preview'} className={styles.previewImage} />
                    )}
                    <span className={styles.previewContent}>
                        <span className={styles.previewTitle}>{preview.title}</span>
                        <span className={styles.previewDesc}>{preview.description}</span>
                        <span className={styles.previewDomain}>{preview.domain}</span>
                    </span>
                </a>
            )}
        </>
    );
};

export default LinkPreview;
