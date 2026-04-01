import { CompareResult } from '@/components/features/Compare/CompareResult/CompareResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '비교 결과 | HotPick',
  description: '우리 생각 얼마나 통할까? 가치관 비교 결과를 확인하세요.',
  robots: { index: false },
};

type ResultPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CompareResultPage({ params }: ResultPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareResult token={token} />
    </>
  );
}
