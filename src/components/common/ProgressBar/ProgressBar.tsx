'use client';

import type { FC } from 'react';

import styles from '@/components/common/ProgressBar/ProgressBar.module.scss';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({ currentStep, totalSteps }) => (
  <div className={styles.container}>
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div key={index} className={`${styles.step} ${index <= currentStep ? styles.active : ''}`} />
    ))}
  </div>
);
