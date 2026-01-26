import styles from '@/components/features/Main/PollCard/PollCard.module.scss';

export const PollCardSkeleton = () => (
  <div className={styles.cardWrapper}>
    <div className={styles.card}>
      <div className={styles.skeletonBackground} />
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSubtitle} />
      <div className={styles.skeletonCount} />
      <div className={styles.skeletonButton} />
    </div>
  </div>
);
