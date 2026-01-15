import Image from 'next/image';

import HelpCircleIcon from '@/assets/icon/HelpCircleIcon';
import { Tooltip } from '@/components/common/Tooltip';
import styles from '@/components/features/Result/TypeCard/TypeCard.module.scss';
import { RESULT_TYPE_DATA } from '@/constants/data';
import type { SelectedOption } from '@/types/result';

const POPULARITY_TOOLTIP_CONTENT = `5개 투표에서 내가 선택한 옵션의 득표율 평균값입니다.
(100%에 가까울수록 대한민국 국룰 취향!)

다른 사람들이 투표하면 수치가 변경됩니다.`;

type TypeCardProps = {
  selectedOptions: SelectedOption[];
};

export const TypeCard = ({ selectedOptions }: TypeCardProps) => {
  // percent > 50인 항목 개수로 유형 결정
  const majorityCount = selectedOptions.filter((opt) => opt.percent > 50).length;
  const typeIndex = Math.max(0, Math.min(5, 5 - majorityCount));
  const resultType = RESULT_TYPE_DATA[typeIndex];

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
            alt={resultType.title}
            width={160}
            height={160}
            className={styles.resultImage}
          />
        </div>
      )}

      <h1 className={styles.title}>{resultType.title}</h1>

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
        <div className={styles.popularityHeaderWrapper}>
          <div className={styles.popularityHeader}>
            <span className={styles.popularityLabel}>대중성 지수</span>
            <Tooltip content={POPULARITY_TOOLTIP_CONTENT}>
              <HelpCircleIcon width={16} height={16} stroke="#8a8a8a" />
            </Tooltip>
          </div>
          <span className={styles.popularityPercent}>{popularityIndex}%</span>
        </div>

        <div className={styles.sliderContainer}>
          <div className={styles.sliderTrackWrapper}>
            <div className={styles.sliderTrack}>
              <div className={styles.sliderFill} style={{ width: `${popularityIndex}%` }} />
            </div>
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
