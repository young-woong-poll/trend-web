import type { FC, ReactNode } from 'react';

import styles from '@/components/common/FlexibleLayout/FlexibleLayout.module.scss';

interface FlexibleLayoutProps {
  children: ReactNode;
}

export const FlexibleLayout: FC<FlexibleLayoutProps> = ({ children }) => (
  <div className={styles.wrapper}>
    <div className={styles.container}>{children}</div>
  </div>
);
