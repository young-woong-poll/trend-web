import type { FC } from 'react';

import styles from '@/components/features/Admin/AdminTrendForm/CombinationCard.module.scss';
import { getOptionTitle } from '@/lib/trendCombinations';
import type { CreateTrendRequest } from '@/types';
import type { ElectionDetail } from '@/types/election';

import type { UseFormRegister } from 'react-hook-form';

interface CombinationCardProps {
  index: number;
  combination: string[];
  register: UseFormRegister<CreateTrendRequest>;
  electionDetails: ElectionDetail[];
  resultTypeLabel: string;
  hasError: boolean;
  handleLabelChange: (key: string, label: string) => void;
}

export const CombinationCard: FC<CombinationCardProps> = ({
  index,
  combination,
  register,
  electionDetails = [],
  resultTypeLabel,
  hasError,
  handleLabelChange,
}) => {
  const key = combination.join('/');

  return (
    <div className={styles.combinationCard}>
      <div className={styles.combinationHeader}>
        <span className={styles.combinationNumber}>#{index + 1}</span>
        <span className={styles.combinationKey}>{key}</span>
      </div>

      <div className={styles.combinationOptions}>
        {combination.map((optionId, electionIndex) => (
          <div key={electionIndex} className={styles.optionBadge}>
            <span className={styles.electionTitle}>{electionDetails[electionIndex]?.title}:</span>
            <span className={styles.optionTitle}>
              {getOptionTitle(electionDetails, electionIndex, optionId)}
            </span>
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
