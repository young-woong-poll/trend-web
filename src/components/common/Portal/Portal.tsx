'use client';

import { useEffect, useState, type FC, type ReactNode } from 'react';

import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
}

export const Portal: FC<PortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return null;
  }

  const portalRoot = document.getElementById('portal-root');
  if (!portalRoot) {
    return null;
  }

  return createPortal(children, portalRoot);
};
