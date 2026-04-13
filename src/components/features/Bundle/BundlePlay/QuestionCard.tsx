'use client';

import { Fragment, type FC } from 'react';

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
}) => (
  <div className={styles.container}>
    <div className={styles.questionArea}>
      {onBack && (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="이전 질문">
          <BackIcon />
        </button>
      )}
      <span className={styles.questionNumber}>Q{index + 1}</span>
      <h2 className={styles.question}>{election.title}</h2>
    </div>

    <div className={styles.options}>
      {(election.options ?? []).map((opt, i) => (
        <Fragment key={opt.electionItemId}>
          {i > 0 && <span className={styles.or}>or</span>}
          <button
            type="button"
            className={`${styles.option} ${selected === opt.electionItemId ? styles.optionSelected : ''}`}
            onClick={() => onSelect(opt.electionItemId ?? '')}
          >
            <span className={styles.optionText}>{opt.title}</span>
          </button>
        </Fragment>
      ))}
    </div>
  </div>
);
