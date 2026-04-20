'use client';

import { useRef, type FC, type ReactNode } from 'react';

import CompareGroupIcon from '@/assets/icon/CompareGroupIcon';
import SparkleIcon from '@/assets/icon/SparkleIcon';
import TrophyIcon from '@/assets/icon/TrophyIcon';
import UserCheckIcon from '@/assets/icon/UserCheckIcon';
import styles from '@/components/features/Main/ContentTabs/ContentTabs.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import { FILTER_TABS, type FilterTabType, type TabSelection } from '@/constants/contentTab';

const TAB_ICONS: Record<FilterTabType, ReactNode> = {
  new: <SparkleIcon className={styles.tabIcon} />,
  top: <TrophyIcon className={styles.tabIcon} />,
  chem: <CompareGroupIcon className={styles.tabIcon} width={13} height={13} />,
  my: <UserCheckIcon className={styles.tabIcon} />,
};

interface ContentTabsProps {
  selectedTab: TabSelection;
  onChange: (tab: TabSelection) => void;
  categories?: CategoryFilterItem[];
}

function isTabActive(selected: TabSelection, kind: 'filter' | 'category', key: string): boolean {
  if (selected.kind !== kind) {
    return false;
  }
  if (selected.kind === 'filter') {
    return selected.type === key;
  }
  return selected.slug === key;
}

export const ContentTabs: FC<ContentTabsProps> = ({ selectedTab, onChange, categories }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToButton = (button: HTMLButtonElement) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();

    if (buttonRect.right > containerRect.right) {
      container.scrollBy({ left: buttonRect.right - containerRect.right + 8, behavior: 'smooth' });
    } else if (buttonRect.left < containerRect.left) {
      container.scrollBy({ left: buttonRect.left - containerRect.left - 8, behavior: 'smooth' });
    }
  };

  const handleFilterClick = (type: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onChange({ kind: 'filter', type: type as FilterTabType });
    scrollToButton(e.currentTarget);
  };

  const handleCategoryClick = (cat: CategoryFilterItem, e: React.MouseEvent<HTMLButtonElement>) => {
    onChange({ kind: 'category', slug: cat.slug, label: cat.label });
    scrollToButton(e.currentTarget);
  };

  return (
    <nav
      role="tablist"
      aria-label="콘텐츠 필터"
      className={styles.container}
      data-testid="content-tabs"
    >
      <div ref={containerRef} className={styles.tabList}>
        {/* 필터 탭: NEW, TOP, MY */}
        {FILTER_TABS.map((tab) => {
          const isActive = isTabActive(selectedTab, 'filter', tab.type);

          return (
            <button
              key={tab.type}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-testid={`content-tab-${tab.type}`}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={(e) => handleFilterClick(tab.type, e)}
            >
              {TAB_ICONS[tab.type]}
              {tab.label}
            </button>
          );
        })}

        {/* 구분자 */}
        {categories && categories.length > 0 && (
          <div className={styles.divider} aria-hidden="true" />
        )}

        {/* 카테고리 탭 */}
        {categories?.map((cat) => {
          const isActive = isTabActive(selectedTab, 'category', cat.slug);
          return (
            <button
              key={cat.slug}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-testid={`content-tab-category-${cat.slug}`}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={(e) => handleCategoryClick(cat, e)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
