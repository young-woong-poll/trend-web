'use client';

import type { FC } from 'react';

import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import styles from '@/components/features/Vote/VoteOption/VoteOption.module.scss';
import { useImagePreload } from '@/hooks/useImagePreload';

interface VoteOptionProps {
  title: string;
  imageUrl: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const VoteOption: FC<VoteOptionProps> = ({
  title,
  imageUrl,
  isSelected = false,
  onClick,
}) => {
  const isImageLoaded = useImagePreload(imageUrl);

  return (
    <div className={styles.wrapper}>
      {/* 스켈레톤 - 이미지 로딩 중에만 표시 */}
      {!isImageLoaded && <Skeleton height={240} borderRadius={12} className={styles.skeleton} />}

      {/* 실제 버튼 - 항상 렌더링하되 opacity로 제어 */}
      <button
        type="button"
        className={`${styles.container} ${isSelected ? styles.selected : ''} ${isImageLoaded ? styles.loaded : styles.loading}`}
        onClick={onClick}
        style={{ backgroundImage: `url(${imageUrl})` }}
      >
        <div className={styles.overlay} />
        <span className={styles.title}>{title}</span>
      </button>
    </div>
  );
};
