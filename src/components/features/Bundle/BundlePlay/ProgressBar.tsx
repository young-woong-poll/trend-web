import type { FC } from 'react';

import styles from '@/components/features/Bundle/BundlePlay/ProgressBar.module.scss';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: FC<ProgressBarProps> = ({ current, total }) => (
  <div className={styles.container}>
    <span className={styles.label}>
      {current} / {total}
    </span>
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${(current / total) * 100}%` }} />
    </div>
  </div>
);
