
import styles from '../page.module.css';

const Carousel = ({ items, type }) => {
    // Determine properties based on data type
    const getProps = () => {
        switch (type) {
            case 'education': return { icon: '🎓', label: 'View Details' };
            case 'articles': return { icon: '✍️', label: 'Read Article' };
            case 'experience': return { icon: '💼', label: 'View Details' };
            default: return { icon: '🚀', label: 'View Project' };
        }
    };

    const { icon, label } = getProps();

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.carouselTrack}>
                {items.map((item, idx) => (
                    <div key={idx} className={styles.carouselCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon}>{icon}</div>
                            {/* Optional: Add a "Featured" badge if relevant */}
                        </div>

                        <div className={styles.cardTitle}>{item.title}</div>

                        {item.subtitle && (
                            <div className={styles.cardSubtitle}>{item.subtitle}</div>
                        )}

                        <div className={styles.cardDesc}>
                            {item.description}
                        </div>

                        <div className={styles.cardFooter}>
                            {item.link && (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.cardLink}
                                >
                                    {label} →
                                </a>
                            )}
                            {item.tags && item.tags.length > 0 && (
                                <div className={styles.cardTags}>
                                    {item.tags.map(tag => (
                                        <span key={tag} className={styles.cardTag}>{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* 'More' Card for Articles/Blogs */}
                {type === 'articles' && (
                    <div className={`${styles.carouselCard} ${styles.moreCard}`}>
                        <div className={styles.moreCardContent}>
                            <div className={styles.moreIcon}>📚</div>
                            <div className={styles.moreText}>More on the blog</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Carousel;
