import { CompareLanding } from '@/components/features/Compare/CompareLanding/CompareLanding';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '가치관 비교 | HotPick',
  description: '우리 생각 얼마나 통할까? 가치관을 비교해보세요.',
};

type ComparePageProps = {
  params: Promise<{ token: string }>;
};

export default async function ComparePage({ params }: ComparePageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <CompareLanding token={token} />
    </>
  );
}
