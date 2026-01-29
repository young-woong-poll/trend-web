'use client';

import { type FC, type ReactNode, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
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
  children?: ReactNode; // 서버에서 렌더링된 정적 HTML (SEO용)
};

export const PollCard: FC<TPollCardProps> = ({
  alias,
  title,
  subtitle,
  createdAt,
  imageUrls = [],
  participantCount = 0,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const isNew = isWithin24Hours(createdAt ?? '');

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
        className={styles.cardWrapper}
        style={{ display: isImageLoaded ? 'block' : 'none' }}
        onClick={() => {
          setIsNavigating(true);
          router.push(`/vote/${alias}`);
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

          {/* NEW Badge */}
          {isNew && <div className={styles.newBadge}>NEW</div>}

          <div className={styles.content}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>

            <p className={styles.count}>참여자 {formatCount(participantCount)}</p>
            <button
              type="button"
              className={styles.button}
              onClick={(e) => {
                e.stopPropagation();
                setIsNavigating(true);
                router.push(`/vote/${alias}`);
              }}
              disabled={isNavigating}
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
