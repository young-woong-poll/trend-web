'use client';

import type { FC } from 'react';

import ShortLogo from '@/assets/icon/ShortLogo';
import styles from '@/components/features/Vote/VoteHeader/VoteHeader.module.scss';

interface VoteHeaderProps {
  title: string;
}

export const VoteHeader: FC<VoteHeaderProps> = ({ title }) => (
  <div className={styles.voteHeader}>
    <div className={styles.logo}>
      <ShortLogo />
    </div>
    <h1 className={styles.title}>{title}</h1>
  </div>
);
