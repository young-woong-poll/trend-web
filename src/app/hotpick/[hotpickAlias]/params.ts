import { getMainDisplay, getTrendDetail } from '@/generated/api/server/display/display';

export async function generateStaticParams() {
  try {
    const response = await getMainDisplay({ size: 100 }, { next: { revalidate: 60 } });
    const mainData = response.status === 200 ? response.data.data : null;

    if (!mainData?.trends) {
      console.warn('[generateStaticParams] No hotpicks data available');
      return [];
    }

    // API 에러가 있는 hotpick은 제외하고 유효한 hotpick만 반환
    const validHotpicks = await Promise.all(
      mainData.trends.map(async (hotpick) => {
        try {
          await getTrendDetail(hotpick.alias ?? '', { next: { revalidate: 60 } });
          return hotpick.alias;
        } catch {
          console.warn(`[generateStaticParams] Skipping hotpick ${hotpick.alias} due to API error`);
          return null;
        }
      })
    );

    return validHotpicks
      .filter((alias): alias is string => alias !== null)
      .map((hotpickAlias) => ({ hotpickAlias }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}
