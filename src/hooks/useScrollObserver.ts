import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollState {
  canScroll: boolean;
  isAtBottom: boolean;
}

/**
 * 스크롤 컨테이너의 스크롤 가능 여부와 바닥 도달 여부를 추적합니다.
 * ResizeObserver, MutationObserver, scroll 이벤트를 통합 관리합니다.
 */
export function useScrollObserver(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<ScrollState>({
    canScroll: false,
    isAtBottom: true,
  });

  const checkScrollState = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const hasScrollableContent = container.scrollHeight > container.clientHeight;
    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 10;

    setScrollState({
      canScroll: hasScrollableContent,
      isAtBottom: isBottom || !hasScrollableContent,
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isActive) {
      return;
    }

    const initialCheck = setTimeout(checkScrollState, 100);

    const resizeObserver = new ResizeObserver(checkScrollState);
    resizeObserver.observe(container);

    const mutationObserver = new MutationObserver(checkScrollState);
    mutationObserver.observe(container, { childList: true, subtree: true });

    container.addEventListener('scroll', checkScrollState);

    return () => {
      clearTimeout(initialCheck);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      container.removeEventListener('scroll', checkScrollState);
    };
  }, [isActive, checkScrollState]);

  return { containerRef, ...scrollState };
}
