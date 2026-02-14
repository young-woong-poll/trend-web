'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/CategoryFilter/CategoryFilter.module.scss';
import { CATEGORY_FILTERS } from '@/constants/category';
import type { CategoryCode } from '@/types/hotpick';

interface CategoryFilterProps {
  selectedCodes: CategoryCode[];
  onChange: (codes: CategoryCode[]) => void;
}

export const CategoryFilter: FC<CategoryFilterProps> = ({ selectedCodes, onChange }) => {
  const isAllSelected = selectedCodes.length === 0;

  const handleClick = (codes: CategoryCode[]) => {
    if (codes.length === 0) {
      // "전체" 선택
      onChange([]);
      return;
    }

    // 이미 선택된 카테고리인지 확인
    const isSelected = codes.every((code) => selectedCodes.includes(code));

    if (isSelected) {
      // 선택 해제
      const updated = selectedCodes.filter((code) => !codes.includes(code));
      onChange(updated);
    } else {
      // 선택 추가
      const newCodes = codes.filter((code) => !selectedCodes.includes(code));
      onChange([...selectedCodes, ...newCodes]);
    }
  };

  return (
    <div className={styles.container}>
      {CATEGORY_FILTERS.map((filter) => {
        const isActive =
          filter.codes.length === 0
            ? isAllSelected
            : filter.codes.every((code) => selectedCodes.includes(code));

        return (
          <button
            key={filter.label}
            type="button"
            className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
            onClick={() => handleClick(filter.codes)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
};
