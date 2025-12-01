// Common types and interfaces

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

/* eslint-disable no-restricted-imports */
export * from './api';
export * from './common';
export * from './election';
export * from './result';
export * from './trend';
export * from './vote';
/* eslint-enable no-restricted-imports */
