'use client';

import type { FC } from 'react';

import styles from '@/components/features/Vote/VoteOption/VoteOption.module.scss';

interface VoteOptionProps {
  title: string;
  imageUrl: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const VoteOption: FC<VoteOptionProps> = ({
  title,
  imageUrl,
  isSelected = false,
  onClick,
}) => (
  <button
    type="button"
    className={`${styles.container} ${isSelected ? styles.selected : ''}`}
    onClick={onClick}
    style={{ backgroundImage: `url(${imageUrl})` }}
  >
    <div className={styles.overlay} />
    <span className={styles.title}>{title}</span>
  </button>
);
