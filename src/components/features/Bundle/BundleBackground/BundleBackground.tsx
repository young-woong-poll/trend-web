import type { FC, ReactNode } from 'react';

import styles from '@/components/features/Bundle/BundleBackground/BundleBackground.module.scss';
import { getCategoryThemeVars } from '@/constants/categoryTheme';
import type { CategoryCode } from '@/types/hotpick';

interface BundleBackgroundProps {
  children: ReactNode;
  fireworks?: boolean;
  categoryCode?: CategoryCode;
  categoryMeta?: string | null;
}

export const BundleBackground: FC<BundleBackgroundProps> = ({
  children,
  fireworks = false,
  categoryCode,
  categoryMeta,
}) => (
  <div className={styles.wrapper} style={getCategoryThemeVars(categoryCode, categoryMeta)}>
    {/* 배경 그라디언트 orb */}
    <div className={styles.orbs}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />
    </div>

    {/* 불꽃놀이 — fireworks prop이 true일 때만 */}
    {fireworks && (
      <div className={styles.fireworks}>
        <div className={`${styles.rocket} ${styles.rocket1}`} />
        <div className={`${styles.rocket} ${styles.rocket2}`} />
        <div className={`${styles.rocket} ${styles.rocket3}`} />
        <div className={`${styles.rocket} ${styles.rocket4}`} />
        <div className={`${styles.rocket} ${styles.rocket5}`} />
        <div className={`${styles.burst} ${styles.burst1}`} />
        <div className={`${styles.burst} ${styles.burst2}`} />
        <div className={`${styles.burst} ${styles.burst3}`} />
      </div>
    )}

    <div className={styles.content}>{children}</div>
  </div>
);
