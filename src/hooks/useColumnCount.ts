import { useEffect, useState } from 'react';

const BREAKPOINT_TABLET = 768;
const BREAKPOINT_DESKTOP = 1024;

function getColumnCount() {
  if (typeof window === 'undefined') {
    return 1;
  }
  if (window.innerWidth >= BREAKPOINT_DESKTOP) {
    return 3;
  }
  if (window.innerWidth >= BREAKPOINT_TABLET) {
    return 2;
  }
  return 1;
}

export function useColumnCount() {
  const [columnCount, setColumnCount] = useState(getColumnCount);

  useEffect(() => {
    const handleResize = () => setColumnCount(getColumnCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columnCount;
}
