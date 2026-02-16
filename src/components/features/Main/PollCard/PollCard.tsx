'use client';

import { type FC, type ReactNode, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import ShareIcon from '@/assets/icon/ShareIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { DeadlineBadge } from '@/components/common/DeadlineBadge';
import styles from '@/components/features/Main/PollCard/PollCard.module.scss';
import { PollCardSkeleton } from '@/components/features/Main/PollCard/PollCardSkeleton';
import { isWithin24Hours } from '@/lib/utils';

type TPollCardProps = {
  alias: string;
  title: string;
  subtitle?: string;
  createdAt?: string;
  imageUrls?: string[];
  participantCount?: number;
  deadline?: string;
  status?: string;
  children?: ReactNode; // 서버에서 렌더링된 정적 HTML (SEO용)
  onShare?: (alias: string) => void;
};

export const PollCard: FC<TPollCardProps> = ({
  alias,
  title,
  subtitle,
  createdAt,
  imageUrls = [],
  participantCount = 0,
  deadline,
  status,
  onShare,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const isNew = isWithin24Hours(createdAt ?? '');
  const isClosed = status === 'CLOSED';

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      {/* 클라이언트 인터랙티브 버전 (이미지 로딩 관리) */}
      {!isImageLoaded && <PollCardSkeleton />}
      <div
        className={`${styles.cardWrapper} ${isClosed ? styles.closed : ''}`}
        style={{ display: isImageLoaded ? 'block' : 'none' }}
        onClick={() => {
          if (isClosed) {
            return;
          }
          setIsNavigating(true);
          router.push(`/hotpick/${alias}`);
        }}
      >
        <div className={styles.card}>
          <div className={styles.imageContainer}>
            <Image
              src={imageUrls[0] ?? ''}
              alt={title}
              width={240}
              height={162}
              className={styles.backgroundImage}
              priority
              onLoad={() => setIsImageLoaded(true)}
            />
            <Image
              src={imageUrls[1] ?? ''}
              alt={title}
              width={240}
              height={162}
              className={styles.backgroundImage}
              priority
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>

          {/* 공유 버튼 */}
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

          {/* NEW Badge */}
          {isNew && !isClosed && <div className={styles.newBadge}>NEW</div>}

          {/* Deadline Badge */}
          {deadline && (
            <div className={styles.deadlineBadgeWrapper}>
              <DeadlineBadge deadline={deadline} compact />
            </div>
          )}

          <div className={styles.content}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>

            <p className={styles.count}>참여자 {formatCount(participantCount)}</p>
            <button
              type="button"
              className={styles.button}
              onClick={(e) => {
                e.stopPropagation();
                if (isClosed) {
                  return;
                }
                setIsNavigating(true);
                router.push(`/hotpick/${alias}`);
              }}
              disabled={isNavigating || isClosed}
            >
              {isNavigating ? (
                <div className={styles.loadingDots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              ) : (
                <>
                  <span>참여</span> <StartArrowIcon width={20} height={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
