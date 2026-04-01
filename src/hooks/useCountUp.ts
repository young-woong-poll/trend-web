import { useEffect, useState } from 'react';

/**
 * 숫자가 0에서 목표값까지 올라가는 카운트업 애니메이션
 */
type EasingFn = (t: number) => number;

const EASINGS: Record<string, EasingFn> = {
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  /** 마지막 구간에서 훨씬 느려짐 — 긴장감 연출용 */
  easeOutQuint: (t) => 1 - (1 - t) ** 5,
};

export function useCountUp(
  target: number,
  duration = 1200,
  easing: keyof typeof EASINGS = 'easeOutCubic'
): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      return;
    }

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = EASINGS[easing](progress);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}
