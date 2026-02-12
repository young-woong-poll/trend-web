'use client';

import type { FC } from 'react';

import Link from 'next/link';

import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/Result/ResultHeader/ResultHeader.module.scss';

interface ResultHeaderProps {
  title: string;
}

export const ResultHeader: FC<ResultHeaderProps> = ({ title }) => (
  <div className={styles.resultHeader}>
    <Link href="/" className={styles.logo} aria-label="메인으로 이동">
      <ShortLogo />
      <h1 className={styles.title}>{title}</h1>
    </Link>
  </div>
);
