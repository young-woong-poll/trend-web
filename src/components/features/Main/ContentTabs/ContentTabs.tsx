'use client';

import { useEffect, useRef, type FC, type ReactNode } from 'react';

import CompareGroupIcon from '@/assets/icon/CompareGroupIcon';
import HeartIcon from '@/assets/icon/HeartIcon';
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

const CATEGORY_ICONS: Record<string, ReactNode> = {
  dating: <HeartIcon className={styles.tabIcon} />,
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
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const button = activeTabRef.current;
    const container = containerRef.current;
    if (!button || !container) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    if (buttonRect.right > containerRect.right) {
      container.scrollBy({
        left: buttonRect.right - containerRect.right + 8,
        behavior: 'smooth',
      });
    } else if (buttonRect.left < containerRect.left) {
      container.scrollBy({
        left: buttonRect.left - containerRect.left - 8,
        behavior: 'smooth',
      });
    }
  }, [selectedTab]);

  const handleFilterClick = (type: string) => {
    onChange({ kind: 'filter', type: type as FilterTabType });
  };

  const handleCategoryClick = (cat: CategoryFilterItem) => {
    onChange({ kind: 'category', slug: cat.slug, label: cat.label });
  };

  return (
    <nav
      role="tablist"
      aria-label="콘텐츠 필터"
      className={styles.container}
      data-testid="content-tabs"
    >
      <div ref={containerRef} className={styles.tabList}>
        {/* 카테고리 탭 (소개팅이 첫 위치) */}
        {categories?.map((cat) => {
          const isActive = isTabActive(selectedTab, 'category', cat.slug);
          return (
            <button
              key={cat.slug}
              ref={isActive ? activeTabRef : undefined}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-testid={`content-tab-category-${cat.slug}`}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {CATEGORY_ICONS[cat.slug]}
              {cat.label}
            </button>
          );
        })}

        {/* 구분자 (카테고리와 필터탭 사이) */}
        {categories && categories.length > 0 && (
          <div className={styles.divider} aria-hidden="true" />
        )}

        {FILTER_TABS.map((tab) => {
          const isActive = isTabActive(selectedTab, 'filter', tab.type);

          return (
            <button
              key={tab.type}
              ref={isActive ? activeTabRef : undefined}
              role="tab"
              type="button"
              aria-selected={isActive}
              data-testid={`content-tab-${tab.type}`}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleFilterClick(tab.type)}
            >
              {TAB_ICONS[tab.type]}
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
