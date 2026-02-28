'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/CategoryFilter/CategoryFilter.module.scss';
import { CATEGORY_FILTERS, type CategoryFilterItem } from '@/constants/category';

interface CategoryFilterProps {
  selectedSlug: string | null;
  onChange: (slug: string | null) => void;
  categories?: CategoryFilterItem[];
}

export const CategoryFilter: FC<CategoryFilterProps> = ({ selectedSlug, onChange, categories }) => {
  const filters = categories && categories.length > 0 ? categories : CATEGORY_FILTERS;

  const handleClick = (slug: string | null) => {
    onChange(slug);
  };

  return (
    <div className={styles.container}>
      {filters.map((filter) => {
        const isActive = filter.slug === selectedSlug;

        return (
          <button
            key={filter.slug ?? 'all'}
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
