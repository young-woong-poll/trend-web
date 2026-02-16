'use client';

import type { FC } from 'react';

import styles from '@/components/common/DeadlineBadge/DeadlineBadge.module.scss';
import { useCountdown } from '@/hooks/useCountdown';

interface DeadlineBadgeProps {
  deadline?: string;
  compact?: boolean;
}

export const DeadlineBadge: FC<DeadlineBadgeProps> = ({ deadline, compact = false }) => {
  const { hasDeadline, isExpired, isUrgent, isImminent, displayText } = useCountdown(deadline);

  if (!hasDeadline) {
    return null;
  }

  const badgeClass = isExpired
    ? styles.expired
    : isUrgent
      ? styles.urgent
      : isImminent
        ? styles.imminent
        : styles.normal;

  return (
    <span className={`${styles.badge} ${badgeClass} ${compact ? styles.compact : ''}`}>
      {displayText}
    </span>
  );
};
