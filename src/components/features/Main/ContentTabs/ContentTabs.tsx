'use client';

import { useCallback, useEffect, useRef, useState, type FC, type ReactNode } from 'react';

import FlameIcon from '@/assets/icon/FlameIcon';
import SparkleIcon from '@/assets/icon/SparkleIcon';
import UserCheckIcon from '@/assets/icon/UserCheckIcon';
import styles from '@/components/features/Main/ContentTabs/ContentTabs.module.scss';
import type { CategoryFilterItem } from '@/constants/category';
import {
  FILTER_TABS,
  HOT_PERIODS,
  type FilterTabType,
  type HotPeriod,
  type TabSelection,
} from '@/constants/contentTab';

const TAB_ICONS: Record<FilterTabType, ReactNode> = {
  new: <SparkleIcon className={styles.tabIcon} />,
  hot: <FlameIcon className={styles.tabIcon} />,
  my: <UserCheckIcon className={styles.tabIcon} />,
};

interface ContentTabsProps {
  selectedTab: TabSelection;
  onChange: (tab: TabSelection) => void;
  categories?: CategoryFilterItem[];
  hotPeriod: HotPeriod;
  onHotPeriodChange: (period: HotPeriod) => void;
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

function getHotPeriodLabel(period: HotPeriod): string {
  return HOT_PERIODS.find((p) => p.value === period)?.label ?? '';
}

export const ContentTabs: FC<ContentTabsProps> = ({
  selectedTab,
  onChange,
  categories,
  hotPeriod,
  onHotPeriodChange,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hotTabRef = useRef<HTMLButtonElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownLeft, setDropdownLeft] = useState(0);

  const isHotActive = isTabActive(selectedTab, 'filter', 'hot');

  // 드롭다운 위치 계산
  const updateDropdownPosition = useCallback(() => {
    const navEl = navRef.current;
    const hotEl = hotTabRef.current;
    if (!navEl || !hotEl) {
      return;
    }

    const navRect = navEl.getBoundingClientRect();
    const hotRect = hotEl.getBoundingClientRect();
    const center = hotRect.left + hotRect.width / 2 - navRect.left;
    setDropdownLeft(center);
  }, []);

  // 드롭다운 열릴 때 위치 갱신
  useEffect(() => {
    if (isDropdownOpen) {
      updateDropdownPosition();
    }
  }, [isDropdownOpen, updateDropdownPosition]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!isDropdownOpen) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current?.contains(e.target as Node)) {
        return;
      }
      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // 다른 탭으로 이동하면 드롭다운 닫기
  useEffect(() => {
    if (!isHotActive) {
      setIsDropdownOpen(false);
    }
  }, [isHotActive]);

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

  const handleHotClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isHotActive) {
        setIsDropdownOpen((prev) => !prev);
      } else {
        onChange({ kind: 'filter', type: 'hot' });
      }
      scrollToButton(e.currentTarget);
    },
    [isHotActive, onChange]
  );

  const handlePeriodSelect = useCallback(
    (period: HotPeriod) => {
      onHotPeriodChange(period);
      setIsDropdownOpen(false);
    },
    [onHotPeriodChange]
  );

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
      ref={navRef}
      role="tablist"
      aria-label="콘텐츠 필터"
      className={styles.container}
      data-testid="content-tabs"
    >
      <div ref={containerRef} className={styles.tabList}>
        {/* 필터 탭: NEW, HOT, MY */}
        {FILTER_TABS.map((tab) => {
          const isActive = isTabActive(selectedTab, 'filter', tab.type);

          if (tab.type === 'hot') {
            return (
              <button
                key={tab.type}
                ref={hotTabRef}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-expanded={isHotActive ? isDropdownOpen : undefined}
                aria-haspopup={isHotActive ? 'listbox' : undefined}
                data-testid="content-tab-hot"
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                onClick={handleHotClick}
              >
                {TAB_ICONS.hot}
                {isActive && (
                  <span className={styles.periodBadge}>{getHotPeriodLabel(hotPeriod)}</span>
                )}
                <span>HOT</span>
                {isActive && (
                  <span className={`${styles.chevron} ${isDropdownOpen ? styles.chevronOpen : ''}`}>
                    ▾
                  </span>
                )}
              </button>
            );
          }

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

      {/* 드롭다운: tabList 밖에 렌더링하여 overflow 영향 없음 */}
      {isDropdownOpen && (
        <div
          className={styles.dropdown}
          role="listbox"
          aria-label="기간 선택"
          style={{ left: dropdownLeft }}
        >
          {HOT_PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="option"
              aria-selected={hotPeriod === item.value}
              className={`${styles.dropdownItem} ${hotPeriod === item.value ? styles.dropdownItemActive : ''}`}
              onClick={() => handlePeriodSelect(item.value)}
              data-testid={`hot-period-${item.value}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};
