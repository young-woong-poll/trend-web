'use client';

import type { FC } from 'react';

import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/Result/ResultHeader/ResultHeader.module.scss';

interface ResultHeaderProps {
  title: string;
}

export const ResultHeader: FC<ResultHeaderProps> = ({ title }) => (
  <div className={styles.resultHeader}>
    <div className={styles.logo}>
      <ShortLogo />
    </div>
    <h1 className={styles.title}>{title}</h1>
  </div>
);
