'use client';

import type { FC } from 'react';

import Link from 'next/link';

import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/Hotpick/VoteHeader/VoteHeader.module.scss';

interface VoteHeaderProps {
  title: string;
}

export const VoteHeader: FC<VoteHeaderProps> = ({ title }) => (
  <div className={styles.voteHeader}>
    <Link href="/" className={styles.logo} aria-label="메인으로 이동">
      <ShortLogo />
      <h1 className={styles.title}>{title}</h1>
    </Link>
  </div>
);
