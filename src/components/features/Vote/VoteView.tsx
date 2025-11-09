'use client';

import type { FC } from 'react';

import styles from './VoteView.module.scss';

interface VoteViewProps {
  type: string;
}

export const VoteView: FC<VoteViewProps> = ({ type }) => (
  <div className={styles.container}>
    <main className={styles.main}>
      <h1 className={styles.title}>Vote Page</h1>
      <p className={styles.description}>Type: {type}</p>
      <p className={styles.placeholder}>투표 페이지 구현 예정</p>
    </main>
  </div>
);
