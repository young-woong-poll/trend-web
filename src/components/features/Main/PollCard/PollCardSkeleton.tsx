import styles from '@/components/features/Main/PollCard/PollCard.module.scss';

export const PollCardSkeleton = () => (
  <div className={styles.cardWrapper}>
    <div className={styles.card}>
      <div className={styles.skeletonBackground} />

      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonSubtitle} />

      <div className={styles.participants}>
        <span className={styles.label}>참여자</span>
        <span className={styles.count}>-</span>
      </div>

      <svg
        className={styles.arrowIcon}
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9 8L15 16L9 24"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </div>
);
