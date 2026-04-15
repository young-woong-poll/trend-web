'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/TopSubFilter/TopSubFilter.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import {
  TOP_PERIODS,
  TOP_CONTENT_TYPES,
  type TopPeriod,
  type TopContentType,
} from '@/constants/contentTab';

interface TopSubFilterProps {
  selectedPeriod: TopPeriod;
  onPeriodChange: (period: TopPeriod) => void;
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  categories?: CategoryFilterItem[];
  selectedContentType: TopContentType;
  onContentTypeChange: (type: TopContentType) => void;
}

export const TopSubFilter: FC<TopSubFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedContentType,
  onContentTypeChange,
}) => {
  const isBundleMode = selectedContentType === 'bundle';

  return (
    <div className={styles.container} data-testid="top-sub-filter">
      <div className={styles.selectRow}>
        {/* 유형 SelectBox */}
        <select
          className={styles.select}
          value={selectedContentType}
          onChange={(e) => onContentTypeChange(e.target.value as TopContentType)}
          data-testid="top-content-type-select"
        >
          {TOP_CONTENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* 기간 SelectBox — 케미 모드에서 숨김 */}
        {!isBundleMode && (
          <select
            className={styles.select}
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value as TopPeriod)}
            data-testid="top-period-select"
          >
            {TOP_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        )}

        {/* 카테고리 SelectBox — 케미 모드에서 숨김 */}
        {!isBundleMode && (
          <select
            className={styles.select}
            value={selectedCategory ?? 'all'}
            onChange={(e) => {
              const val = e.target.value;
              onCategoryChange(val === 'all' ? null : val);
            }}
            data-testid="top-category-select"
          >
            <option value="all">전체 카테고리</option>
            {categories?.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};
