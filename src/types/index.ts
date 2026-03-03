// Common types and interfaces

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

/* eslint-disable no-restricted-imports */
export * from './api';
export * from './common';
export * from './result';
export * from './hotpick';
/* eslint-enable no-restricted-imports */
