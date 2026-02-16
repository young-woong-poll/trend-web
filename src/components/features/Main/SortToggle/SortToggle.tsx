'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/SortToggle/SortToggle.module.scss';
import type { HotpickSortOption } from '@/constants/sort';

interface SortToggleProps {
  value: HotpickSortOption;
  onChange: (value: HotpickSortOption) => void;
}

const SORT_OPTIONS: { value: HotpickSortOption; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'latest', label: '최신순' },
];

export const SortToggle: FC<SortToggleProps> = ({ value, onChange }) => (
  <div className={styles.container}>
    {SORT_OPTIONS.map((option) => (
      <button
        key={option.value}
        type="button"
        className={`${styles.option} ${value === option.value ? styles.active : ''}`}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
