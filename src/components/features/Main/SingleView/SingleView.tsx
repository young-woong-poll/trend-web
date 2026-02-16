/**
 * @deprecated 통합 혼합 피드로 전환됨 — SingleCard가 MainView에서 직접 렌더링됩니다.
 * Phase 1 정리 시 이 파일을 삭제하세요.
 */
'use client';

import type { FC } from 'react';

interface SingleViewProps {
  categoryCodes?: string[];
}

export const SingleView: FC<SingleViewProps> = () => null;
