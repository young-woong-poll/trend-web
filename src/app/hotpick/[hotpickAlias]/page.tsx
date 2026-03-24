import { notFound } from 'next/navigation';

import { StructuredData } from '@/components/common/StructuredData/StructuredData';
import { SingleDetailContent } from '@/components/features/Hotpick/SingleDetailView/SingleDetailContent';
import { displayQueries } from '@/hooks/api/useDisplay';
import { createServerQueryClient } from '@/lib/react-query';
import { generateHotpickStructuredData } from '@/lib/seo/structuredData';

interface HotpickPageProps {
  params: Promise<{
    hotpickAlias: string;
  }>;
}

export const revalidate = 60;

export const dynamicParams = true;

export { generateStaticParams } from '@/app/hotpick/[hotpickAlias]/params';
export { generateMetadata } from '@/app/hotpick/[hotpickAlias]/metadata';

export default async function HotpickPage({ params }: HotpickPageProps) {
  const queryClient = createServerQueryClient();
  const { hotpickAlias } = await params;

  const hotpickQuery = displayQueries.hotpick(hotpickAlias);

  try {
    const hotpickData = await queryClient.fetchQuery(hotpickQuery);

    if (!hotpickData?.hotpick) {
      notFound();
    }

    // BUNDLE 타입: 리뉴얼 예정 — 404 반환
    if (hotpickData.hotpick.type !== 'SINGLE') {
      notFound();
    }

    const hotpick = hotpickData.hotpick;
    const structuredData = generateHotpickStructuredData(hotpick, hotpickAlias);

    return (
      <>
        <StructuredData data={structuredData} />
        <SingleDetailContent hotpickAlias={hotpickAlias} />
      </>
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_NOT_FOUND') {
      throw error;
    }
    // eslint-disable-next-line no-console
    console.error('[HotpickPage] Failed to fetch hotpick data:', error);
    notFound();
  }
}
