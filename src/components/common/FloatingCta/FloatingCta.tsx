import type { FC, ReactNode } from 'react';

import styles from '@/components/common/FloatingCta/FloatingCta.module.scss';

interface FloatingCtaProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export const FloatingCta: FC<FloatingCtaProps> = ({ children, onClick, disabled }) => (
  <div className={styles.container}>
    <button type="button" className={styles.button} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  </div>
);
