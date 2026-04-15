import type { FC } from 'react';

import FemaleIcon from '@/assets/icon/FemaleIcon';
import MaleIcon from '@/assets/icon/MaleIcon';
import styles from '@/components/features/Compare/GroupResult/GenderBadge.module.scss';

interface GenderBadgeProps {
  gender?: 'MALE' | 'FEMALE';
  /** Badge size in px (default 14) */
  size?: number;
  /** Icon size in px (default 8) */
  iconSize?: number;
}

export const GenderBadge: FC<GenderBadgeProps> = ({ gender, size = 14, iconSize = 8 }) => {
  if (!gender) {
    return null;
  }

  return (
    <span
      className={gender === 'MALE' ? styles.badgeMale : styles.badgeFemale}
      style={{ width: size, height: size }}
    >
      {gender === 'MALE' ? <MaleIcon size={iconSize} /> : <FemaleIcon size={iconSize} />}
    </span>
  );
};
