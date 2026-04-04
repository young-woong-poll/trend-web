import { GroupResult } from '@/components/features/Compare/GroupResult/GroupResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '그룹 비교 결과 | HotPick',
  description: '우리 그룹의 가치관, 얼마나 통할까?',
  robots: { index: false },
};

type GroupPageProps = {
  params: Promise<{ token: string }>;
};

export default async function GroupResultPage({ params }: GroupPageProps) {
  const { token } = await params;

  return (
    <>
      <MainHeader />
      <GroupResult token={token} />
    </>
  );
}
