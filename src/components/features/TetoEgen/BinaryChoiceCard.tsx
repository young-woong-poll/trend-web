'use client';

import { type FC, type ReactNode, useState } from 'react';

import styles from '@/components/features/TetoEgen/BinaryChoiceCard.module.scss';

type Option<T extends string> = {
  value: T;
  label: string;
};

type BinaryChoiceCardProps<T extends string> = {
  // <strong> 등 inline 강조용 JSX 허용 — 닉네임/답 강조 일관성 위해
  question: ReactNode;
  helper?: string;
  left: Option<T>;
  right: Option<T>;
  onSelect: (value: T) => void;
  disabled?: boolean;
};

const BinaryChoiceCard = <T extends string>({
  question,
  helper,
  left,
  right,
  onSelect,
  disabled = false,
}: BinaryChoiceCardProps<T>) => {
  const [activated, setActivated] = useState<T | null>(null);

  const handleClick = (value: T) => {
    if (disabled || activated) {
      return;
    }
    setActivated(value);
    // 0.2s 시각 피드백 후 onSelect
    window.setTimeout(() => {
      onSelect(value);
      // 다음 단계 진입 후 잠시 뒤 초기화 (재사용 시 깜빡임 방지)
      window.setTimeout(() => setActivated(null), 200);
    }, 200);
  };

  return (
    <div className={styles.root}>
      <h2 className={styles.question}>{question}</h2>
      {helper && <p className={styles.helper}>{helper}</p>}
      <div className={styles.choices}>
        <button
          type="button"
          className={`${styles.card} ${activated === left.value ? styles.activated : ''}`}
          onClick={() => handleClick(left.value)}
          disabled={disabled}
        >
          <span className={styles.label}>{left.label}</span>
        </button>
        <button
          type="button"
          className={`${styles.card} ${activated === right.value ? styles.activated : ''}`}
          onClick={() => handleClick(right.value)}
          disabled={disabled}
        >
          <span className={styles.label}>{right.label}</span>
        </button>
      </div>
    </div>
  );
};

const BinaryChoiceCardComponent: FC<BinaryChoiceCardProps<string>> = BinaryChoiceCard;
export default BinaryChoiceCardComponent;
