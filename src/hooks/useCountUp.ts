import { useEffect, useState } from 'react';

/**
 * 숫자가 0에서 목표값까지 올라가는 카운트업 애니메이션
 */
export function useCountUp(target: number, duration = 1200): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}
