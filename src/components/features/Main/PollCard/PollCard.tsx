import Image from 'next/image';
import Link from 'next/link';

import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Main/PollCard/PollCard.module.scss';

type TPollCardProps = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  participantCount: number;
};

export const PollCard = ({ id, title, subtitle, imageUrl, participantCount }: TPollCardProps) => {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 유효한 이미지 URL인지 확인
  const isValidImageUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // 유효하지 않은 URL인 경우 placeholder 이미지 사용
  const validImageUrl = isValidImageUrl(imageUrl)
    ? imageUrl
    : 'https://picsum.photos/400/300?random=placeholder';

  return (
    <Link href={`/vote/${id}`} className={styles.cardWrapper}>
      <div className={styles.card}>
        {/* Next.js Image 컴포넌트 - 자동 최적화 */}
        <Image
          src={validImageUrl}
          alt={title}
          fill
          className={styles.backgroundImage}
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />

        <div className={styles.overlay} />
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.participants}>
          <span className={styles.label}>참여자</span>
          <span className={styles.count}>{formatCount(participantCount)}</span>
        </div>

        <Button variant="gradient" width={160} className={styles.startButton}>
          <span>
            시작하기
            <StartArrowIcon />
          </span>
        </Button>
      </div>
    </Link>
  );
};
