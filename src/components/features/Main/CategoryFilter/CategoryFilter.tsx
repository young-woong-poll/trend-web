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

    // 이미 선택된 카테고리인지 확인 → 해제하면 "전체"로 복귀
    const isSelected = codes.every((code) => selectedCodes.includes(code));

    if (isSelected) {
      onChange([]);
    } else {
      // 단일 선택 — 기존 선택을 교체
      onChange(codes);
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
