'use client';

import type { FC } from 'react';

import styles from '@/components/common/ProgressBar/ProgressBar.module.scss';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const PRIMARY_START = { r: 255, g: 0, b: 255 }; // #ff00ff
const PRIMARY_END = { r: 255, g: 69, b: 0 }; // #ff4500

const interpolateColor = (percent: number) => {
  const r = Math.round(PRIMARY_START.r + (PRIMARY_END.r - PRIMARY_START.r) * (percent / 100));
  const g = Math.round(PRIMARY_START.g + (PRIMARY_END.g - PRIMARY_START.g) * (percent / 100));
  const b = Math.round(PRIMARY_START.b + (PRIMARY_END.b - PRIMARY_START.b) * (percent / 100));
  return `rgb(${r}, ${g}, ${b})`;
};

export const ProgressBar: FC<ProgressBarProps> = ({ currentStep, totalSteps }) => (
  <div className={styles.container}>
    {Array.from({ length: totalSteps }).map((_, index) => {
      const isActive = index <= currentStep;
      const startPercent = (index / totalSteps) * 100;
      const endPercent = ((index + 1) / totalSteps) * 100;

      return (
        <div
          key={index}
          className={`${styles.step} ${isActive ? styles.active : ''}`}
          style={
            isActive
              ? {
                  background: `linear-gradient(90deg, ${interpolateColor(startPercent)} 0%, ${interpolateColor(endPercent)} 100%)`,
                }
              : undefined
          }
        />
      );
    })}
  </div>
);
