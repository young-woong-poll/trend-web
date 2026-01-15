import { useRef, useState, type FC, type ReactNode } from 'react';

import styles from '@/components/common/Tooltip/Tooltip.module.scss';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip: FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipTop, setTooltipTop] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateTooltipPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setTooltipTop(rect.bottom + 8);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTooltipPosition();
    setIsVisible(!isVisible);
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setIsVisible(true);
  };

  return (
    <div className={styles.tooltipContainer}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.tooltipTrigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleClick}
      >
        {children}
      </button>
      {isVisible && (
        <div className={styles.tooltipContent} style={{ top: tooltipTop }}>
          {content}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
