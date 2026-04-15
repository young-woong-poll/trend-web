'use client';

import type { FC } from 'react';

import Image from 'next/image';

import BackIcon from '@/assets/icon/BackIcon';
import styles from '@/components/features/Bundle/BundlePlay/QuestionCard.module.scss';
import type { BundleElection } from '@/types/bundle';

interface QuestionCardProps {
  election: BundleElection;
  index: number;
  selected: string | null;
  onSelect: (electionItemId: string) => void;
  onBack?: () => void;
}

export const QuestionCard: FC<QuestionCardProps> = ({
  election,
  index,
  selected,
  onSelect,
  onBack,
}) => {
  const options = election.options ?? [];
  const hasImage = options.some((opt) => opt.imageUrl);

  return (
    <div className={styles.container}>
      <div className={styles.questionArea}>
        {onBack && (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
            aria-label="이전 질문"
          >
            <BackIcon />
          </button>
        )}
        <span className={styles.questionNumber}>Q{index + 1}</span>
        <h2 className={styles.question}>{election.title}</h2>
      </div>

      <div className={styles.options}>
        {options.map((opt) => (
          <button
            key={opt.electionItemId}
            type="button"
            className={`${styles.option} ${selected === opt.electionItemId ? styles.optionSelected : ''}`}
            onClick={() => onSelect(opt.electionItemId ?? '')}
          >
            {hasImage && opt.imageUrl && (
              <div className={styles.optionImage}>
                <Image
                  src={opt.imageUrl}
                  alt={opt.title ?? ''}
                  fill
                  sizes="(max-width: 672px) 45vw, 300px"
                  className={styles.optionImg}
                />
              </div>
            )}
            <span className={styles.optionText}>{opt.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
