'use client';

import { useState, type FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/SingleCard/SingleCard.module.scss';
import { isWithin24Hours } from '@/lib/utils';

interface SingleCardProps {
  alias: string;
  title: string;
  imageUrl?: string;
  deadline?: string;
  participantCount?: number;
  status?: string;
  createdAt?: string;
}

export const SingleCard: FC<SingleCardProps> = ({
  alias,
  title,
  imageUrl,
  deadline,
  participantCount = 0,
  status,
  createdAt,
}) => {
  const router = useRouter();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const isHot = isWithin24Hours(createdAt ?? '');
  const isClosed = status === 'CLOSED';

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div
      className={`${styles.card} ${isClosed ? styles.closed : ''}`}
      onClick={() => {
        if (isClosed) {
          return;
        }
        router.push(`/hotpick/${alias}`);
      }}
    >
      <div className={styles.imageContainer}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            width={240}
            height={180}
            className={`${styles.image} ${isImageLoaded ? styles.loaded : ''}`}
            onLoad={() => setIsImageLoaded(true)}
          />
        )}
        {!imageUrl && <div className={styles.imagePlaceholder} />}
      </div>

      {isHot && !isClosed && <div className={styles.hotBadge}>HOT</div>}

      {deadline && (
        <div className={styles.deadlineBadgeWrapper}>
          <DeadlineBadge deadline={deadline} compact />
        </div>
      )}

      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.meta}>
          <span className={styles.count}>{formatCount(participantCount)}명</span>
        </div>
      </div>
    </div>
  );
};
