'use client';

import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  buildMockCompareLink,
  buildMockGroupResult,
  type MockGroupOptions,
} from '@/app/dev/_mock/groupMock';
import { MyResultView } from '@/components/features/Compare/MyResultView/MyResultView';
import { compareKeys } from '@/hooks/api/useCompare';

interface MockMyResultPageProps {
  options: MockGroupOptions;
}

/**
 * React Query 캐시에 mock을 직접 주입해 신규 MyResultView를 렌더.
 * 레거시 MockGroupResultPage는 FullGroupResultView 프리뷰용으로 그대로 유지된다.
 */
export function MockMyResultPage({ options }: MockMyResultPageProps) {
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

  return <MyResultView token={options.token} />;
}
