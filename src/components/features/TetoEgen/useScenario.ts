// src/components/features/TetoEgen/useScenario.ts
//
// URL 쿼리 ?mock=empty|hit|miss|tie 를 읽어 MSW 시나리오로 전달.

'use client';

import { useSearchParams } from 'next/navigation';

export type ScenarioParam = 'empty' | 'hit' | 'miss' | 'tie' | 'default' | null;

export const useScenario = (): ScenarioParam => {
  const params = useSearchParams();
  const value = params?.get('mock');
  if (
    value === 'empty' ||
    value === 'hit' ||
    value === 'miss' ||
    value === 'tie' ||
    value === 'default'
  ) {
    return value;
  }
  return null;
};
