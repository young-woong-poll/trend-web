import { getMainDisplay, getTrendDetail } from '@/generated/api/server/display/display';

export async function generateStaticParams() {
  try {
    const response = await getMainDisplay({ size: 100 }, { next: { revalidate: 60 } });
    const mainData = response.status === 200 ? response.data.data : null;

    if (!mainData?.trends) {
      console.warn('[generateStaticParams] No trends data available');
      return [];
    }

    // API 에러가 있는 trend는 제외하고 유효한 trend만 반환
    const validTrends = await Promise.all(
      mainData.trends.map(async (trend) => {
        try {
          await getTrendDetail(trend.alias ?? '', { next: { revalidate: 60 } });
          return trend.alias;
        } catch {
          console.warn(`[generateStaticParams] Skipping trend ${trend.alias} due to API error`);
          return null;
        }
      })
    );

    return validTrends
      .filter((alias): alias is string => alias !== null)
      .map((trendAlias) => ({ trendAlias }));
  } catch (error) {
    console.error('[generateStaticParams] Failed to generate static params:', error);
    // 에러 발생 시 빈 배열 반환 (동적 렌더링으로 fallback)
    return [];
  }
}
