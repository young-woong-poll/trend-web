'use client';

import { type FC } from 'react';

import TetoEgenLayout from '@/components/features/TetoEgen/TetoEgenLayout';
import styles from '@/components/features/TetoEgen/TetoEgenLoading.module.scss';

const TetoEgenLoading: FC = () => (
  <TetoEgenLayout>
    <div className={styles.loadingWrap} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <span className={styles.srOnly}>불러오는 중</span>
    </div>
  </TetoEgenLayout>
);

export default TetoEgenLoading;
