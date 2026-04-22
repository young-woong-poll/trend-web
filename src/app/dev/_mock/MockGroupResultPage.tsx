'use client';

import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  buildMockCompareLink,
  buildMockGroupResult,
  type MockGroupOptions,
} from '@/app/dev/_mock/groupMock';
import { FullGroupResultView } from '@/components/features/Compare/GroupResult/FullGroupResultView';
import { compareKeys } from '@/hooks/api/useCompare';

interface MockGroupResultPageProps {
  options: MockGroupOptions;
}

/**
 * React Query 캐시에 mock을 직접 주입해 FullGroupResultView를 렌더.
 * MSW 핸들러 우회 — BE 응답 형태 그대로 확인용.
 */
export function MockGroupResultPage({ options }: MockGroupResultPageProps) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);

  const mock = useMemo(() => {
    const result = buildMockGroupResult(options);
    const link = buildMockCompareLink(result);
    return { result, link };
  }, [options]);

  useEffect(() => {
    qc.setQueryData(compareKeys.groupResult(options.token), mock.result);
    qc.setQueryData(compareKeys.link(options.token), mock.link);
    setReady(true);
  }, [qc, mock, options.token]);

  if (!ready) {
    return null;
  }

  return <FullGroupResultView token={options.token} />;
}
