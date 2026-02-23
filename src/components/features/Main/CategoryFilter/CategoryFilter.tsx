'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/CategoryFilter/CategoryFilter.module.scss';
import { CATEGORY_FILTERS } from '@/constants/category';

interface CategoryFilterProps {
  selectedSlug: string | null;
  onChange: (slug: string | null) => void;
}

export const CategoryFilter: FC<CategoryFilterProps> = ({ selectedSlug, onChange }) => {
  const handleClick = (slug: string | null) => {
    if (slug === selectedSlug) {
      // 이미 선택된 항목 클릭 → 전체로 복귀
      onChange(null);
    } else {
      onChange(slug);
    }
  };

  return (
    <div className={styles.container}>
      {CATEGORY_FILTERS.map((filter) => {
        const isActive = filter.slug === selectedSlug;

        return (
          <button
            key={filter.label}
            type="button"
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            onClick={() => handleClick(filter.slug)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};
