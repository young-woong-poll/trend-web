'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/MainTabNavigation/MainTabNavigation.module.scss';

export type MainTab = 'trend' | 'single';

interface MainTabNavigationProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export const MainTabNavigation: FC<MainTabNavigationProps> = ({ activeTab, onChange }) => (
  <div className={styles.container}>
    <div className={styles.tabList}>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'trend' ? styles.tabActive : ''}`}
        onClick={() => onChange('trend')}
      >
        트렌드
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'single' ? styles.tabActive : ''}`}
        onClick={() => onChange('single')}
      >
        Single
      </button>
    </div>
    <div
      className={styles.indicator}
      style={{ transform: `translateX(${activeTab === 'single' ? '100%' : '0'})` }}
    />
  </div>
);
