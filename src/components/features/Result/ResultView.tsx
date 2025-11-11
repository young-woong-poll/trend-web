'use client';

import type { FC } from 'react';

import styles from './ResultView.module.scss';

interface ResultViewProps {
  type: string;
}

export const ResultView: FC<ResultViewProps> = ({ type }) => (
  <div className={styles.container}>
    <h1 className={styles.title}>Result Page</h1>
    <p className={styles.description}>Type: {type}</p>
    <p className={styles.placeholder}>결과 페이지 구현 예정</p>
  </div>
);
