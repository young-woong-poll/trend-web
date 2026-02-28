'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/CategoryFilter/CategoryFilter.module.scss';
import { CATEGORY_FILTERS, type CategoryFilterItem } from '@/constants/category';

interface CategoryFilterProps {
  selectedSlug: string | null;
  onChange: (slug: string | null) => void;
  categories?: CategoryFilterItem[];
  isLoading?: boolean;
}

const SKELETON_WIDTHS = [48, 72, 56, 48, 64];

export const CategoryFilter: FC<CategoryFilterProps> = ({
  selectedSlug,
  onChange,
  categories,
  isLoading,
}) => {
  if (isLoading && !categories) {
    return (
      <div className={styles.container}>
        {SKELETON_WIDTHS.map((width, i) => (
          <div key={i} className={styles.chipSkeleton} style={{ width: `${width}px` }} />
        ))}
      </div>
    );
  }

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
