import type { FC } from 'react';

import styles from '@/components/features/Bundle/BundlePlay/ProgressBar.module.scss';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({ current, total }) => (
  <div className={styles.container}>
    {/* 스텝 인디케이터 */}
    <div className={styles.stepIndicator}>
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < current;
        const isActive = stepNum === current;

        return (
          <span key={stepNum}>
            <span
              className={`${styles.step} ${isCompleted ? styles.stepCompleted : ''} ${isActive ? styles.stepActive : ''}`}
            />
            {i < total - 1 && (
              <span
                className={`${styles.stepConnector} ${stepNum < current ? styles.stepConnectorActive : ''}`}
              />
            )}
          </span>
        );
      })}
    </div>

    {/* 라벨 */}
    <div className={styles.label}>
      <strong>{current}</strong> / {total}
    </div>

    {/* 프로그레스 바 */}
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${(current / total) * 100}%` }} />
    </div>
  </div>
);
