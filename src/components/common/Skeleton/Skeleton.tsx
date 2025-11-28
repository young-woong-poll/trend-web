import type { FC, CSSProperties } from 'react';

import styles from '@/components/common/Skeleton/Skeleton.module.scss';

type TSkeletonProps = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
};

export const Skeleton: FC<TSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className,
}) => {
  const style: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return <div className={`${styles.skeleton} ${className || ''}`} style={style} />;
};
