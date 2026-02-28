import { getMain, getDetail } from '@/generated/api/server/hotpick/hotpick';

export async function generateStaticParams() {
  try {
    const response = await getMain({ size: 100 }, { next: { revalidate: 60 } });
    const mainData = response.status === 200 ? response.data.data : null;

    if (!mainData?.hotpicks) {
      console.warn('[generateStaticParams] No hotpicks data available');
      return [];
    }

    // API 에러가 있는 hotpick은 제외하고 유효한 hotpick만 반환
    const validHotpicks = await Promise.all(
      mainData.hotpicks.map(async (hotpick) => {
        try {
          await getDetail(hotpick.slug ?? '', { next: { revalidate: 60 } });
          return hotpick.slug;
        } catch {
          console.warn(`[generateStaticParams] Skipping hotpick ${hotpick.slug} due to API error`);
          return null;
        }
      })
    );

    return validHotpicks
      .filter((slug): slug is string => slug !== null)
      .map((hotpickAlias) => ({ hotpickAlias }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}
