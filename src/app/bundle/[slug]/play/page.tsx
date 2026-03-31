import { BundlePlay } from '@/components/features/Bundle/BundlePlay/BundlePlay';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '번들 풀기 | HotPick',
  robots: { index: false },
};

type PlayPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundlePlayPage({ params }: PlayPageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader minimal />
      <BundlePlay slug={slug} />
    </>
  );
}
