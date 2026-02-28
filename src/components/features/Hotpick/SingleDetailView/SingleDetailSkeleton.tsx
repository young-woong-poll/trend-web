import type { FC } from 'react';

import styles from '@/components/features/Hotpick/SingleDetailView/SingleDetailView.module.scss';

export const SingleDetailSkeleton: FC = () => (
  <div className={styles.container}>
    <div className={styles.voteCard}>
      {/* 카테고리 + 마감 */}
      <div className={styles.topRow}>
        <div className={styles.categoryRow}>
          <span className={`${styles.categoryTag} ${styles.skeletonPulse} ${styles.skeletonTag}`} />
          <span
            className={`${styles.categoryTag} ${styles.skeletonPulse} ${styles.skeletonTagSmall}`}
          />
        </div>
        <span className={`${styles.skeletonPulse} ${styles.skeletonBadge}`} />
      </div>
      {/* 질문 */}
      <div className={styles.questionRow}>
        <div className={`${styles.skeletonPulse} ${styles.skeletonLogo}`} />
        <div className={styles.skeletonTextContainer}>
          <div className={`${styles.skeletonPulse} ${styles.skeletonTextWide}`} />
          <div className={`${styles.skeletonPulse} ${styles.skeletonTextMedium}`} />
        </div>
      </div>
      {/* 투표 버튼 */}
      <div className={styles.voteArea}>
        <div className={styles.buttonGroupTwo}>
          <div className={`${styles.skeletonPulse} ${styles.skeletonButton}`} />
          <div className={`${styles.skeletonPulse} ${styles.skeletonButton}`} />
        </div>
      </div>
      {/* 메타 */}
      <div className={styles.metaRow}>
        <span className={`${styles.skeletonPulse} ${styles.skeletonMeta}`} />
      </div>
      {/* CTA */}
      <div className={styles.shareCta}>
        <div className={`${styles.skeletonPulse} ${styles.skeletonCta}`} />
      </div>
    </div>
  </div>
);
