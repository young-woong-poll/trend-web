'use client';

import { type FC, type ReactNode, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import styles from '@/components/features/Main/PollCard/PollCard.module.scss';
import { PollCardSkeleton } from '@/components/features/Main/PollCard/PollCardSkeleton';

type TPollCardProps = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  participantCount: number;
  children: ReactNode; // 서버에서 렌더링된 정적 HTML (SEO용)
};

export const PollCard: FC<TPollCardProps> = ({
  id,
  title,
  subtitle,
  imageUrl,
  participantCount,
  children,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      {/* 서버에서 생성된 정적 HTML (SEO용) */}
      <noscript>{children}</noscript>

      {/* 클라이언트 인터랙티브 버전 (이미지 로딩 관리) */}
      {!isImageLoaded && <PollCardSkeleton />}
      <Link
        href={`/vote/${id}`}
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
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>

          <div className={styles.participants}>
            <span className={styles.label}>참여자</span>
            <span className={styles.count}>{formatCount(participantCount)}</span>
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
