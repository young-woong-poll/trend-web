import Image from 'next/image';

import HelpCircleIcon from '@/assets/icon/HelpCircleIcon';
import styles from '@/components/features/Result/TypeCard/TypeCard.module.scss';
import type { ResultType, SelectedOption } from '@/types/result';

type TypeCardProps = {
  resultType: ResultType;
  selectedOptions: SelectedOption[];
};

export const TypeCard = ({ resultType, selectedOptions }: TypeCardProps) => {
  // 대중성 지수 계산: 모든 selectedOption의 percent 평균
  const popularityIndex =
    selectedOptions.length > 0
      ? Math.round(
          selectedOptions.reduce((sum, opt) => sum + opt.percent, 0) / selectedOptions.length
        )
      : 0;

  return (
    <div className={styles.card}>
      <p className={styles.subtitle}>당신의 취향은</p>

      {resultType.imageUrl && (
        <div className={styles.imageWrapper}>
          <Image
            src={resultType.imageUrl}
            alt={resultType.label}
            width={160}
            height={160}
            className={styles.resultImage}
          />
        </div>
      )}

      <h1 className={styles.title}>{resultType.label}</h1>

      {resultType.description && <p className={styles.description}>{resultType.description}</p>}

      {resultType.tags.length > 0 && (
        <div className={styles.tags}>
          {resultType.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 대중성 지수 */}
      <div className={styles.popularitySection}>
        <div className={styles.popularityHeader}>
          <span className={styles.popularityLabel}>대중성 지수</span>
          <HelpCircleIcon width={16} height={16} stroke="#8a8a8a" />
        </div>
        <span className={styles.popularityPercent}>{popularityIndex}%</span>

        <div className={styles.sliderContainer}>
          <div className={styles.sliderTrack}>
            <div className={styles.sliderThumb} style={{ left: `${popularityIndex}%` }} />
          </div>
          <div className={styles.sliderLabels}>
            <span>개성</span>
            <span>주류</span>
          </div>
        </div>
      </div>
    </div>
  );
};
