import { BundleIntro } from '@/components/features/Bundle/BundleIntro/BundleIntro';
import { MainHeader } from '@/components/features/Main/MainHeader/MainHeader';

export { generateMetadata } from '@/app/bundle/[slug]/metadata';

type BundlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BundlePage({ params }: BundlePageProps) {
  const { slug } = await params;

  return (
    <>
      <MainHeader />
      <BundleIntro slug={slug} />
    </>
  );
}
