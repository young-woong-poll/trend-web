import StartArrowIcon from '@/assets/icon/StartArrowIcon';
import { Button } from '@/components/common/Button/Button';
import styles from '@/components/features/Main/PollCard/PollCard.module.scss';

type TPollCardProps = {
  title: string;
  subtitle: string;
  imageUrl: string;
  participantCount: number;
  onStart: () => void;
};

export const PollCard = ({
  title,
  subtitle,
  imageUrl,
  participantCount,
  onStart,
}: TPollCardProps) => {
  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div
      className={styles.card}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className={styles.overlay} />
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.participants}>
        <span className={styles.label}>참여자</span>
        <span className={styles.count}>{formatCount(participantCount)}</span>
      </div>

      <Button variant="gradient" width={160} className={styles.startButton} onClick={onStart}>
        시작하기
        <StartArrowIcon />
      </Button>
    </div>
  );
};
