import { useState, type FC, type ReactNode } from 'react';

import styles from '@/components/common/Tooltip/Tooltip.module.scss';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip: FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 요소로 이벤트 전파 방지
    setIsVisible(!isVisible);
  };

  return (
    <div className={styles.tooltipContainer}>
      <button
        type="button"
        className={styles.tooltipTrigger}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleClick}
      >
        {children}
      </button>
      {isVisible && <div className={styles.tooltipContent}>{content}</div>}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
