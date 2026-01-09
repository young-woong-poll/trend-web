'use client';

import { type FC, type ReactNode, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import CheckIcon from '@/assets/icon/CheckIcon';
import CopyIcon from '@/assets/icon/CopyIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import styles from '@/components/features/Main/PollCard/PollCard.module.scss';
import { PollCardSkeleton } from '@/components/features/Main/PollCard/PollCardSkeleton';
import { useModal } from '@/contexts/ModalContext';
import { getRelativeTime, isWithin48Hours } from '@/lib/utils';

type TPollCardProps = {
  alias: string;
  title: string;
  subtitle: string;
  createdAt: string;
  imageUrl: string;
  participantCount: number;
  children: ReactNode; // 서버에서 렌더링된 정적 HTML (SEO용)
};

export const PollCard: FC<TPollCardProps> = ({
  alias,
  title,
  subtitle,
  createdAt,
  imageUrl,
  participantCount,
  children,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { showToast } = useModal();
  const isNew = isWithin48Hours(createdAt);

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const trendUrl = `${window.location.origin}/vote/${alias}`;
      await navigator.clipboard.writeText(trendUrl);
      showToast('트렌드 링크가 복사되었습니다', <CheckIcon />);
    } catch (_error) {
      showToast('링크 복사에 실패했습니다', <InfoIcon />);
    }
  };

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) */}
      <noscript>{children}</noscript>

      {/* 클라이언트 인터랙티브 버전 (이미지 로딩 관리) */}
      {!isImageLoaded && <PollCardSkeleton />}
      <Link
        href={`/vote/${alias}`}
        className={styles.cardWrapper}
        style={{ display: isImageLoaded ? 'block' : 'none' }}
      >
        <div className={styles.card}>
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={styles.backgroundImage}
            sizes="(max-width: 768px) 100vw, 480px"
            priority
            onLoad={() => setIsImageLoaded(true)}
          />

          <div className={styles.overlay} />

          {/* NEW Badge */}
          {isNew && <div className={styles.newBadge}>NEW</div>}

          {/* Copy Button */}
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopyClick}
            aria-label="트렌드 링크 복사"
          >
            <CopyIcon width={20} height={20} />
          </button>

          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>

          <div className={styles.participants}>
            <span className={styles.label}>참여자</span>
            <span className={styles.count}>{formatCount(participantCount)}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.date}>{getRelativeTime(createdAt)}</span>
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
      </Link>
    </>
  );
};
