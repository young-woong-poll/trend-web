import type { FC } from 'react';

import styles from '@/components/common/CategoryBadge/CategoryBadge.module.scss';
import { getCategoryTheme } from '@/constants/categoryTheme';
import type { CategoryCode } from '@/types/hotpick';

interface CategoryBadgeProps {
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
  /** categoryCode가 없을 때 직접 표시할 텍스트 */
  label?: string;
}

export const CategoryBadge: FC<CategoryBadgeProps> = ({ categoryCode, categoryMeta, label }) => {
  const theme = getCategoryTheme(categoryCode, categoryMeta);
  const text = label ?? theme.label;

  return <span className={styles.badge}>{text}</span>;
};
