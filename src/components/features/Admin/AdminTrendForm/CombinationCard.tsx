import type { FC } from 'react';

import styles from '@/components/features/Admin/AdminTrendForm/CombinationCard.module.scss';
import type { CombinationItem } from '@/lib/trendCombinations';

interface CombinationCardProps {
  combination: CombinationItem[];
  resultTypeLabel: string;
  hasError: boolean;
  handleLabelChange: (key: string, label: string) => void;
}

export const CombinationCard: FC<CombinationCardProps> = ({
  combination,
  resultTypeLabel,
  hasError,
  handleLabelChange,
}) => {
  const key = combination.map((item) => item.optionId).join('/');

  return (
    <div className={styles.combinationCard}>
      <div className={styles.combinationHeader}>
        Key : <span className={styles.combinationKey}>{key}</span>
      </div>

      <div className={styles.combinationOptions}>
        {combination.map((combinationItem) => (
          <div
            key={`${combinationItem.electionId}-${combinationItem.optionId}`}
            className={styles.optionBadge}
          >
            <span className={styles.electionTitle}>선거제목 : {combinationItem.electionTitle}</span>
            <span className={styles.optionTitle}>선택항목 : {combinationItem.optionTitle}</span>
          </div>
        ))}
      </div>

      <div className={styles.combinationInput}>
        <label htmlFor={`label-${key}`} className={styles.label}>
          Label <span className={styles.required}>*</span>
          {hasError && <span className={styles.errorText}> (필수 입력)</span>}
        </label>
        <input
          id={`label-${key}`}
          type="text"
          value={resultTypeLabel}
          onChange={(e) => handleLabelChange(key, e.target.value)}
          className={`${styles.input} ${hasError ? styles.inputError : ''}`}
          placeholder="예: 열정 타입"
        />
      </div>
    </div>
  );
};
