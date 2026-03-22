import { getMain } from '@/generated/api/server/hotpick/hotpick';

export async function generateStaticParams() {
  try {
    const response = await getMain({ size: 100 }, { next: { revalidate: 60 } });
    const mainData = response.status === 200 ? response.data.data : null;

    if (!mainData?.hotpicks) {
      console.warn('[generateStaticParams] No hotpicks data available');
      return [];
    }

    // slug가 있는 hotpick만 반환 (개별 getDetail 호출 제거 — page.tsx에서 notFound() 처리)
    return mainData.hotpicks
      .filter((hotpick): hotpick is typeof hotpick & { slug: string } => !!hotpick.slug)
      .map((hotpick) => ({ hotpickAlias: hotpick.slug }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}
