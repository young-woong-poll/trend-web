'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

interface ResultContentProps {
  hotpickAlias: string;
  resultId: string;
}

/**
 * 결과 페이지 컨텐츠 — BUNDLE 전용 (현재 BE 미지원)
 * BUNDLE 결과 API가 없으므로 메인으로 리다이렉트
 */
export const ResultContent = ({
  hotpickAlias: _hotpickAlias,
  resultId: _resultId,
}: ResultContentProps) => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
};
