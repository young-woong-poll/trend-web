import { useCallback, useEffect, useState } from 'react';

/**
 * URL 해시(#anchor) 감지 및 관리 훅
 *
 * - 초기 로딩 시 location.hash 파싱
 * - hashchange 이벤트 감지
 * - clearAnchor()로 hash 제거 (history.replaceState)
 */
export const useHashAnchor = () => {
  const [anchor, setAnchor] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const hash = window.location.hash.slice(1);
    return hash || null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setAnchor(hash || null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const clearAnchor = useCallback(() => {
    setAnchor(null);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  return { anchor, clearAnchor };
};
