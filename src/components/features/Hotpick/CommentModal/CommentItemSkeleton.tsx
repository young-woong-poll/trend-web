import type { FC } from 'react';

import styles from '@/components/features/Hotpick/CommentModal/CommentItemSkeleton.module.scss';

interface CommentItemSkeletonProps {
  count?: number;
}

export const CommentItemSkeleton: FC<CommentItemSkeletonProps> = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className={styles.commentItemSkeleton}>
        {/* 헤더: 닉네임, 시간 */}
        <div className={styles.header}>
          <div className={styles.nickname} />
          <div className={styles.time} />
        </div>

        {/* 댓글 내용 */}
        <div className={styles.content}>
          <div className={styles.line1} />
          <div className={styles.line2} />
        </div>

        {/* 하단: 좋아요 버튼 */}
        <div className={styles.footer}>
          <div className={styles.likeButton} />
        </div>
      </div>
    ))}
  </>
);
