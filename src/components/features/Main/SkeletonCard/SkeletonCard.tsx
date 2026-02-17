import type { FC } from 'react';

import styles from '@/components/features/Main/SkeletonCard/SkeletonCard.module.scss';

/**
 * 무한 스크롤 로딩 시 표시되는 스켈레톤 카드.
 * SingleCard 레이아웃과 동일한 구조 (헤더 + 질문 + 2열 버튼).
 */
export const SkeletonCard: FC = () => (
  <div className={styles.card}>
    {/* 헤더: 카테고리 + 참여자 + 공유 아이콘 */}
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.bone} style={{ width: 56, height: 14 }} />
        <div className={styles.bone} style={{ width: 40, height: 14 }} />
      </div>
      <div className={styles.bone} style={{ width: 24, height: 24, borderRadius: '50%' }} />
    </div>

    {/* 질문 텍스트 (2줄) */}
    <div className={styles.question}>
      <div className={styles.bone} style={{ width: '90%', height: 18 }} />
      <div className={styles.bone} style={{ width: '60%', height: 18 }} />
    </div>

    {/* 투표 버튼 2열 */}
    <div className={styles.buttons}>
      <div className={styles.bone} style={{ height: 44 }} />
      <div className={styles.bone} style={{ height: 44 }} />
    </div>
  </div>
);
