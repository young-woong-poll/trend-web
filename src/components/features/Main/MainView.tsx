'use client';

import { Suspense, type FC, type ReactNode } from 'react';

import { MainViewClient } from '@/components/features/Main/MainViewClient';

type TMainViewProps = {
  children?: ReactNode;
};

export const MainView: FC<TMainViewProps> = ({ children }) => (
  <Suspense fallback={null}>
    <MainViewClient>{children}</MainViewClient>
  </Suspense>
);
