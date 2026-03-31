import { BundleResult } from '@/components/features/Bundle/BundleResult/BundleResult';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '번들 결과 | HotPick',
  robots: { index: false },
};

type ResultPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundleResultPage({ params }: ResultPageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundleResult slug={slug} />
    </>
  );
}
