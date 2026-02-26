'use client';

import { useState, type FC } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import CheckIcon from '@/assets/icon/CheckIcon';
import ShareIcon from '@/assets/icon/ShareIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/BundleCard/BundleCard.module.scss';
import { formatCount, isWithin24Hours } from '@/lib/utils';

interface BundleCardProps {
  alias: string;
  title: string;
  subtitle?: string;
  categories?: string[];
  createdAt?: string;
  participantCount?: number;
  electionCount?: number;
  imageUrls?: string[];
  deadline?: string;
  status?: string;
  participated?: boolean;
  onShare?: (alias: string) => void;
}

export const BundleCard: FC<BundleCardProps> = ({
  alias,
  title,
  subtitle,
  categories = [],
  createdAt,
  participantCount = 0,
  electionCount,
  imageUrls,
  deadline,
  status,
  participated = false,
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
        {/* 상단: 카테고리 + 공유 */}
        <div className={styles.topRow}>
          <div className={styles.categoryRow}>
            {categories.map((code, i) => (
              <span key={code}>
                {i > 0 && <span className={styles.categorySeparator}>·</span>}
                <span className={styles.categoryTag}>{code}</span>
              </span>
            ))}
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

        {/* 제목: 로고 이미지 + 텍스트 + 배지 */}
        <div className={styles.titleRow}>
          {thumbnailUrl && (
            <Image
              src={thumbnailUrl}
              alt={title}
              width={40}
              height={40}
              className={styles.titleLogo}
            />
          )}
          <div className={styles.titleGroup}>
            <div className={styles.titleWithBadges}>
              <h3 className={styles.title}>{title}</h3>
              <div className={styles.titleBadges}>
                <span className={styles.bundleBadge}>
                  {electionCount ? `${electionCount}개 투표` : '투표 모음'}
                </span>
                {isNew && !isClosed && !participated && (
                  <span className={styles.newBadge}>NEW</span>
                )}
              </div>
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {/* CTA 버튼 */}
        <button
          type="button"
          className={`${styles.ctaButton} ${participated ? styles.participated : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          disabled={isNavigating || isClosed}
        >
          {isNavigating ? (
            <span className={styles.loading}>...</span>
          ) : participated ? (
            <>
              결과 보기 <StartArrowIcon width={16} height={16} />
            </>
          ) : (
            <>
              시작하기 <StartArrowIcon width={16} height={16} />
            </>
          )}
        </button>

        {/* 메타: 참여자 · 데드라인 · 참여완료 */}
        <div className={styles.metaRow}>
          <span className={styles.participants}>{formatCount(participantCount)}명 참여</span>
          {deadline && (
            <>
              <span className={styles.dot} />
              <DeadlineBadge deadline={deadline} compact />
            </>
          )}
          {participated && (
            <>
              <span className={styles.dot} />
              <span className={styles.participatedBadge}>
                <CheckIcon width={10} height={10} /> 참여 완료
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
