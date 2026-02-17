'use client';

import { useState, type FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import ShareIcon from '@/assets/icon/ShareIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/BundleCard/BundleCard.module.scss';
import { isWithin24Hours } from '@/lib/utils';

interface BundleCardProps {
  alias: string;
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  createdAt?: string;
  participantCount?: number;
  electionCount?: number;
  imageUrls?: string[];
  deadline?: string;
  status?: string;
  onShare?: (alias: string) => void;
}

const formatCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

export const BundleCard: FC<BundleCardProps> = ({
  alias,
  title,
  subtitle,
  categoryLabel,
  createdAt,
  participantCount = 0,
  electionCount,
  imageUrls,
  deadline,
  status,
  onShare,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const isNew = isWithin24Hours(createdAt ?? '');
  const isClosed = status === 'CLOSED';
  const thumbnailUrl = imageUrls?.[0];

  const handleClick = () => {
    if (isClosed) {
      return;
    }
    setIsNavigating(true);
    router.push(`/hotpick/${alias}`);
  };

  return (
    <div
      className={`${styles.card} ${isClosed ? styles.closed : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleClick();
        }
      }}
    >
      {/* 좌측 그라데이션 보더 */}
      <div className={styles.accentBorder} />

      <div className={styles.content}>
        {/* 헤더: 카테고리 + 참여자 수 + 데드라인 + 공유 */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {categoryLabel && <span className={styles.category}>{categoryLabel}</span>}
            <span className={styles.participants}>{formatCount(participantCount)}명 참여</span>
            {deadline && <DeadlineBadge deadline={deadline} compact />}
          </div>
          <button
            type="button"
            className={styles.shareButton}
            onClick={(e) => {
              e.stopPropagation();
              onShare?.(alias);
            }}
            aria-label="공유"
          >
            <ShareIcon />
          </button>
        </div>

        {/* 썸네일 이미지 */}
        {thumbnailUrl && (
          <div className={styles.thumbnail}>
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(max-width: 480px) 100vw, 600px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 제목 + 부제 */}
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {/* 하단: 번들 배지 + NEW + CTA */}
        <div className={styles.footer}>
          <div className={styles.meta}>
            <span className={styles.bundleBadge}>
              {electionCount ? `${electionCount}개 투표` : '투표 모음'}
            </span>
            {isNew && !isClosed && <span className={styles.newBadge}>NEW</span>}
          </div>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={isNavigating || isClosed}
          >
            {isNavigating ? (
              <span className={styles.loading}>...</span>
            ) : (
              <>
                시작하기 <StartArrowIcon width={16} height={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
