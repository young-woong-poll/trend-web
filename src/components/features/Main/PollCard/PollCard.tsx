'use client';

import { type FC, type ReactNode, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import CheckIcon from '@/assets/icon/CheckIcon';
import CopyDoubleIcon from '@/assets/icon/CopyDoubleIcon';
import InfoIcon from '@/assets/icon/InfoIcon';
import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import styles from '@/components/features/Main/PollCard/PollCard.module.scss';
import { PollCardSkeleton } from '@/components/features/Main/PollCard/PollCardSkeleton';
import { useModal } from '@/contexts/ModalContext';
import { isWithin48Hours } from '@/lib/utils';

type TPollCardProps = {
  alias: string;
  title: string;
  subtitle?: string;
  createdAt?: string;
  imageUrl1?: string;
  imageUrl2?: string;
  participantCount?: number;
  children?: ReactNode; // 서버에서 렌더링된 정적 HTML (SEO용)
};

export const PollCard: FC<TPollCardProps> = ({
  alias,
  title,
  subtitle,
  createdAt,
  imageUrl1,
  imageUrl2,
  participantCount = 0,
}) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { showToast } = useModal();
  const isNew = isWithin48Hours(createdAt ?? '');

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
      {/* 클라이언트 인터랙티브 버전 (이미지 로딩 관리) */}
      {!isImageLoaded && <PollCardSkeleton />}
      <div className={styles.cardWrapper} style={{ display: isImageLoaded ? 'block' : 'none' }}>
        <div className={styles.card}>
          <div className={styles.imageContainer}>
            <Image
              src={imageUrl1 ?? ''}
              alt={title}
              width={240}
              height={162}
              className={styles.backgroundImage}
              priority
              onLoad={() => setIsImageLoaded(true)}
            />
            <Image
              src={imageUrl2 ?? ''}
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
            {/* Copy Button */}
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopyClick}
              aria-label="트렌드 링크 복사"
            >
              <CopyDoubleIcon width={24} height={24} />
            </button>

            <h2 className={styles.title}>{title}</h2>
            <p className={styles.subtitle}>{subtitle}</p>

            <p className={styles.count}>참여자 {formatCount(participantCount)}</p>
            <Link href={`/vote/${alias}`} className={styles.button}>
              <span>참여</span> <StartArrowIcon width={20} height={20} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
