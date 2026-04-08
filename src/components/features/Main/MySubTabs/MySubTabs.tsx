'use client';

import type { FC } from 'react';

import styles from '@/components/features/Main/MySubTabs/MySubTabs.module.scss';
import { MY_SUB_TABS, type MySubTabType } from '@/constants/contentTab';

interface MySubTabsProps {
  activeTab: MySubTabType;
  onChange: (tab: MySubTabType) => void;
}

export const MySubTabs: FC<MySubTabsProps> = ({ activeTab, onChange }) => (
  <div className={styles.container}>
    {MY_SUB_TABS.map((tab) => (
      <button
        key={tab.type}
        type="button"
        className={`${styles.tab} ${activeTab === tab.type ? styles.active : ''}`}
        onClick={() => onChange(tab.type)}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
